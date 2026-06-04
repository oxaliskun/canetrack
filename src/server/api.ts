import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID, randomInt } from 'crypto';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

const EMAIL_FROM = process.env.EMAIL_USER || 'noreply@canetrack.app';

const pendingRegistrations = new Map<string, { name: string; email: string; passwordHash: string; contactNumber: string | null; address: string | null; farmName: string | null; farmLocation: string | null; idImageUrl?: string; code: string; expiresAt: number }>();
const pendingResets = new Map<string, { email: string; code: string; expiresAt: number }>();

const cleanupPending = setInterval(() => {
  const now = Date.now();
  for (const [email, reg] of pendingRegistrations) {
    if (reg.expiresAt < now) pendingRegistrations.delete(email);
  }
  for (const [email, reset] of pendingResets) {
    if (reset.expiresAt < now) pendingResets.delete(email);
  }
}, 60000);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${randomUUID()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  }
});

const prisma = new PrismaClient();
export const apiRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_fallback_secret_minimum_32_chars';
const THRESHOLD = Number(process.env.DISCREPANCY_THRESHOLD) || 50;

// --- TYPES ---
export interface AuthRequest extends Request {
  user?: { userId: string; role: string; name: string };
  file?: Express.Multer.File;
}

// --- MIDDLEWARE ---
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = { userId: decoded.userId, role: decoded.role, name: decoded.name };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const roleGuard = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }
    next();
  };
};

// Audit Helper
const writeAuditLog = async (userId: string, action: string, targetId?: string, targetType?: string) => {
  try {
    await prisma.auditLog.create({
      data: { userId, action, targetId, targetType }
    });
  } catch (e) { console.error('Audit Log failed', e); }
};

// --- AUTH ROUTES ---
apiRouter.post('/auth/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, contactNumber, address, farmName, farmLocation, idImageUrl } = req.body;

    if (!name || !email || !password || !contactNumber) {
      res.status(400).json({ message: 'Name, email, contact number, and password are required' });
      return;
    }

    if (!/^09\d{9}$/.test(contactNumber)) {
      res.status(400).json({ message: 'Contact number must be 11 digits starting with 09' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ message: 'Email already in use' });
      return;
    }

    if (pendingRegistrations.has(email)) {
      pendingRegistrations.delete(email);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const code = String(randomInt(100000, 999999));
    pendingRegistrations.set(email, {
      name, email, passwordHash, contactNumber: contactNumber || null, address: address || null,
      farmName: farmName || null, farmLocation: farmLocation || null, idImageUrl, code,
      expiresAt: Date.now() + 600000
    });

    try {
      sgMail.send({
        from: EMAIL_FROM,
        to: email,
        subject: 'Verify your CaneTrack account',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
            <h1 style="color:#059669;">CaneTrack</h1>
            <p>Hi <strong>${name}</strong>,</p>
            <p>Your verification code is:</p>
            <div style="font-size:32px;font-weight:900;letter-spacing:8px;text-align:center;padding:24px;background:#f0fdf4;border-radius:12px;color:#059669;margin:24px 0;">${code}</div>
            <p>Enter this code to verify your email and start tracking your harvest.</p>
            <p style="color:#94a3b8;font-size:12px;">If you didn't create this account, ignore this email.</p>
          </div>
        `
      }).catch(e => {
        console.error('Email send failed:', e.response?.body || e.message);
      });
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr);
    }

    res.status(201).json({ message: 'Verification code sent to your email', needsVerification: true, email });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

apiRouter.post('/auth/verify-email', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      res.status(400).json({ message: 'Email and verification code are required' });
      return;
    }
    const pending = pendingRegistrations.get(email);
    if (!pending) {
      res.status(400).json({ message: 'No pending registration found. Please register again.' });
      return;
    }
    if (pending.expiresAt < Date.now()) {
      pendingRegistrations.delete(email);
      res.status(400).json({ message: 'Verification code expired. Please register again.' });
      return;
    }
    if (pending.code !== code) {
      res.status(400).json({ message: 'Invalid verification code' });
      return;
    }

    const user = await prisma.user.create({
      data: {
        name: pending.name, email: pending.email, passwordHash: pending.passwordHash,
        role: 'FARMER', contactNumber: pending.contactNumber, address: pending.address,
        emailVerified: true, verificationCode: null,
        verificationStatus: 'PENDING'
      },
      select: { id: true, name: true, email: true, role: true, contactNumber: true, address: true, profilePicture: true }
    });
    await prisma.farm.create({
      data: {
        farmName: pending.farmName || `${pending.name}'s Farm`,
        location: pending.farmLocation || 'Local Region',
        barangay: 'Unspecified',
        hectares: 5,
        ownerId: user.id
      }
    });

    if (pending.idImageUrl) {
      await prisma.verificationDocument.create({
        data: { userId: user.id, documentType: 'ID', imageUrl: pending.idImageUrl, status: 'PENDING' }
      });
    }

    pendingRegistrations.delete(email);
    res.json({ message: 'Email verified successfully! Please wait for admin verification.', verificationStatus: 'PENDING' });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

apiRouter.post('/auth/resend-code', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }
    const pending = pendingRegistrations.get(email);
    if (!pending) {
      res.status(400).json({ message: 'No pending registration. Please register again.' });
      return;
    }
    const newCode = String(randomInt(100000, 999999));
    pending.code = newCode;
    pending.expiresAt = Date.now() + 600000;
    sgMail.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Your new CaneTrack verification code',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <h1 style="color:#059669;">CaneTrack</h1>
          <p>Hi <strong>${pending.name}</strong>,</p>
          <p>Your new verification code is:</p>
          <div style="font-size:32px;font-weight:900;letter-spacing:8px;text-align:center;padding:24px;background:#f0fdf4;border-radius:12px;color:#059669;margin:24px 0;">${newCode}</div>
          <p>Enter this code to verify your email and start tracking your harvest.</p>
          <p style="color:#94a3b8;font-size:12px;">If you didn't request this, ignore this email.</p>
        </div>
      `
    }).catch(e => console.error('Resend email failed:', e.response?.body || e.message));
    res.json({ message: 'New verification code sent' });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

apiRouter.post('/auth/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ message: 'No account found with this email' });
      return;
    }
    const code = String(randomInt(100000, 999999));
    pendingResets.set(email, { email, code, expiresAt: Date.now() + 600000 });
    sgMail.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Reset your CaneTrack password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <h1 style="color:#059669;">CaneTrack</h1>
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>Your password reset code is:</p>
          <div style="font-size:32px;font-weight:900;letter-spacing:8px;text-align:center;padding:24px;background:#f0fdf4;border-radius:12px;color:#059669;margin:24px 0;">${code}</div>
          <p>Enter this code to reset your password. It expires in 10 minutes.</p>
          <p style="color:#94a3b8;font-size:12px;">If you didn't request this, ignore this email.</p>
        </div>
      `
    }).catch(e => console.error('Forgot password email failed:', e.response?.body || e.message));
    res.json({ message: 'Reset code sent to your email', email });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

apiRouter.post('/auth/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      res.status(400).json({ message: 'Email, code, and new password are required' });
      return;
    }
    const reset = pendingResets.get(email);
    if (!reset) {
      res.status(400).json({ message: 'No reset request found. Please request a code again.' });
      return;
    }
    if (reset.expiresAt < Date.now()) {
      pendingResets.delete(email);
      res.status(400).json({ message: 'Reset code expired. Please request a new one.' });
      return;
    }
    if (reset.code !== code) {
      res.status(400).json({ message: 'Invalid reset code' });
      return;
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { email }, data: { passwordHash } });
    pendingResets.delete(email);
    res.json({ message: 'Password reset successfully! You can now sign in.' });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

apiRouter.post('/auth/resubmit-verification', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { idImageUrl } = req.body;
    if (!idImageUrl) { res.status(400).json({ message: 'ID image is required' }); return; }
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user || user.role !== 'FARMER') { res.status(404).json({ message: 'Farmer not found' }); return; }
    if (user.verificationStatus !== 'REJECTED') { res.status(400).json({ message: 'Account is not in rejected state' }); return; }

    // Mark old documents as replaced
    await prisma.verificationDocument.updateMany({
      where: { userId: req.user!.userId, status: 'PENDING' },
      data: { status: 'REJECTED', rejectionReason: 'Replaced by new submission' }
    });

    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { verificationStatus: 'PENDING', rejectionReason: null }
    });
    await prisma.verificationDocument.create({
      data: { userId: req.user!.userId, documentType: 'ID', imageUrl: idImageUrl, status: 'PENDING' }
    });
    res.json({ message: 'Verification resubmitted successfully', verificationStatus: 'PENDING' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.post('/auth/verify-farmer', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, action, assignedMill, rejectionReason } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'FARMER') {
      res.status(404).json({ message: 'Farmer not found' });
      return;
    }
    if (action === 'approve') {
      await prisma.user.update({
        where: { id: userId },
        data: { verificationStatus: 'VERIFIED', verifiedAt: new Date(), verifiedBy: req.user!.userId, assignedMill: assignedMill || null, rejectionReason: null }
      });
      sgMail.send({
        from: EMAIL_FROM, to: user.email,
        subject: 'Your CaneTrack account has been approved',
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;"><h1 style="color:#059669;">CaneTrack</h1><p>Hi <strong>${user.name}</strong>,</p><p>Your account has been approved${assignedMill ? ` and assigned to <strong>${assignedMill}</strong>` : ''}.</p><p>You can now sign in and start tracking your deliveries.</p></div>`
      }).catch(e => console.error('Approval email failed:', e.response?.body || e.message));
      await writeAuditLog(req.user!.userId, 'VERIFY_FARMER', userId, 'User');
      res.json({ message: 'Farmer approved successfully' });
    } else if (action === 'reject') {
      await prisma.user.update({
        where: { id: userId },
        data: { verificationStatus: 'REJECTED', rejectionReason: rejectionReason || 'Documents did not meet requirements' }
      });
      sgMail.send({
        from: EMAIL_FROM, to: user.email,
        subject: 'Your CaneTrack verification was not approved',
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;"><h1 style="color:#059669;">CaneTrack</h1><p>Hi <strong>${user.name}</strong>,</p><p>Your account verification was not approved.</p><p><strong>Reason:</strong> ${rejectionReason || 'Documents did not meet requirements'}</p><p>You can upload new documents and resubmit.</p></div>`
      }).catch(e => console.error('Rejection email failed:', e.response?.body || e.message));
      await writeAuditLog(req.user!.userId, 'REJECT_FARMER', userId, 'User');
      res.json({ message: 'Farmer rejected' });
    } else {
      res.status(400).json({ message: 'Action must be "approve" or "reject"' });
    }
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

apiRouter.post('/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    if (!user.isActive) {
       res.status(403).json({ message: 'Account deactivated' });
       return;
    }
    if (user.verificationStatus === 'PENDING') {
      res.status(403).json({ message: 'Your account is pending verification. Please wait for admin approval.', verificationStatus: 'PENDING' });
      return;
    }
    if (user.verificationStatus === 'REJECTED') {
      res.status(403).json({ message: user.rejectionReason || 'Your account was rejected.', verificationStatus: 'REJECTED', rejectionReason: user.rejectionReason });
      return;
    }
    const token = jwt.sign({ userId: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
    await writeAuditLog(user.id, 'LOGIN', user.id, 'User');
    res.json({ token, user: { id: user.id, userId: user.id, name: user.name, email: user.email, role: user.role, contactNumber: user.contactNumber, address: user.address, profilePicture: user.profilePicture, verificationStatus: user.verificationStatus, assignedMill: user.assignedMill } });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

apiRouter.post('/auth/logout', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await writeAuditLog(req.user!.userId, 'LOGOUT', req.user!.userId, 'User');
    res.json({ message: 'Logged out successfully' });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

apiRouter.get('/auth/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        include: { farms: { select: { id: true, farmName: true, location: true, barangay: true, hectares: true, cropType: true, description: true, isArchived: true } } }
      });
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json({ user: { id: user.id, userId: user.id, name: user.name, email: user.email, role: user.role, contactNumber: user.contactNumber, address: user.address, profilePicture: user.profilePicture, farms: user.farms } });
  } catch(e: any) { res.status(500).json({ message: e.message }); }
});

// --- PROFILE ROUTES (self-service) ---
apiRouter.get('/users/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { farms: { select: { id: true, farmName: true, location: true, barangay: true, hectares: true, cropType: true, description: true, isArchived: true } } }
    });
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    res.json({ user: { id: user.id, userId: user.id, name: user.name, email: user.email, role: user.role, contactNumber: user.contactNumber, address: user.address, profilePicture: user.profilePicture, farms: user.farms } });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.patch('/users/profile', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, contactNumber, address, profilePicture, farmName, farmLocation } = req.body;

    if (name !== undefined && !name.trim()) {
      res.status(400).json({ message: 'Name cannot be empty' });
      return;
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber;
    if (address !== undefined) updateData.address = address;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, contactNumber: true, address: true, profilePicture: true }
    });

    // If user is a FARMER, allow updating farm info
    if (req.user!.role === 'FARMER') {
      const farmUpdate: any = {};
      if (farmName !== undefined) farmUpdate.farmName = farmName;
      if (farmLocation !== undefined) farmUpdate.location = farmLocation;
      if (Object.keys(farmUpdate).length > 0) {
        await prisma.farm.updateMany({
          where: { ownerId: req.user!.userId },
          data: farmUpdate
        });
      }
    }

    // Fetch farm data for farmer
    let farms: any[] = [];
    if (req.user!.role === 'FARMER') {
      farms = await prisma.farm.findMany({ where: { ownerId: req.user!.userId } });
    }

    await writeAuditLog(req.user!.userId, 'UPDATE_PROFILE', req.user!.userId, 'User');
    res.json({ message: 'Profile updated successfully', user: { ...user, farms } });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// Admin creates staff users
apiRouter.post('/users', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
   try {
     const { name, email, password, role, contactNumber, address } = req.body;
     const existing = await prisma.user.findUnique({ where: { email } });
     if (existing) {
       res.status(409).json({ message: 'Email already in use' });
       return;
     }
     const passwordHash = await bcrypt.hash(password, 10);
     const user = await prisma.user.create({
       data: { name, email, passwordHash, role, contactNumber, address },
       select: { id: true, name: true, email: true, role: true, contactNumber: true, address: true }
     });
      await writeAuditLog(req.user!.userId, 'CREATE_USER', user.id, 'User');
      res.status(201).json({ message: 'Staff user created successfully', user });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// --- FILE UPLOAD ---
apiRouter.post('/upload', authMiddleware, (req: AuthRequest, res: Response): void => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      res.status(400).json({ message: 'File too large. Max 5MB.' });
      return;
    }
    if (err) {
      res.status(400).json({ message: 'Upload failed. Only images allowed.' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ message: 'No file provided' });
      return;
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const url = `${baseUrl}/uploads/${req.file.filename}`;
    res.json({ url });
  });
});

// --- DOCUMENTS ROUTES ---
apiRouter.post('/documents', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { documentType, imageUrl, farmId } = req.body;
    if (!documentType || !imageUrl) {
      res.status(400).json({ message: 'Document type and image URL are required' });
      return;
    }
    const doc = await prisma.verificationDocument.create({
      data: { userId: req.user!.userId, documentType, imageUrl, farmId: farmId || null }
    });
    res.status(201).json(doc);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

apiRouter.get('/documents', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId } = req.query;
    const where: any = { userId: req.user!.userId };
    if (farmId) where.farmId = farmId as string;
    const docs = await prisma.verificationDocument.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json({ documents: docs });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

apiRouter.get('/admin/documents', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { status, userId } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId as string;
    const docs = await prisma.verificationDocument.findMany({
      where, include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: 'desc' }
    });
    res.json({ documents: docs });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

apiRouter.patch('/documents/:id/status', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({ message: 'Status must be APPROVED or REJECTED' });
      return;
    }
    const doc = await prisma.verificationDocument.update({
      where: { id }, data: { status, rejectionReason: rejectionReason || null }
    });
    res.json(doc);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// --- TRUCK ROUTES ---
apiRouter.post('/trucks', authMiddleware, roleGuard(['FARMER']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { plateNumber, make, model, capacity, color } = req.body;
    if (!plateNumber || !make || !model || !capacity) {
      res.status(400).json({ message: 'plateNumber, make, model, capacity are required' });
      return;
    }
    const truck = await prisma.truck.create({
      data: { plateNumber: plateNumber.toUpperCase(), make, model, capacity: Number(capacity), color, ownerId: req.user!.userId }
    });
    res.status(201).json(truck);
  } catch (e: any) {
    if (e.code === 'P2002') { res.status(409).json({ message: 'Plate number already exists' }); return; }
    res.status(500).json({ message: e.message });
  }
});

apiRouter.get('/trucks', authMiddleware, roleGuard(['FARMER']), async (req: AuthRequest, res: Response) => {
  try {
    const trucks = await prisma.truck.findMany({ where: { ownerId: req.user!.userId }, orderBy: { createdAt: 'desc' } });
    res.json({ trucks });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.get('/trucks/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const truck = await prisma.truck.findFirst({ where: { id: req.params.id, ownerId: req.user!.userId } });
    if (!truck) { res.status(404).json({ message: 'Truck not found' }); return; }
    res.json(truck);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.patch('/trucks/:id', authMiddleware, roleGuard(['FARMER']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.truck.findFirst({ where: { id: req.params.id, ownerId: req.user!.userId } });
    if (!existing) { res.status(404).json({ message: 'Truck not found' }); return; }
    const { plateNumber, make, model, capacity, color, isArchived } = req.body;
    const truck = await prisma.truck.update({
      where: { id: req.params.id },
      data: { ...(plateNumber && { plateNumber: plateNumber.toUpperCase() }), ...(make && { make }), ...(model && { model }), ...(capacity && { capacity: Number(capacity) }), ...(color !== undefined && { color }), ...(isArchived !== undefined && { isArchived }) }
    });
    res.json(truck);
  } catch (e: any) {
    if (e.code === 'P2002') { res.status(409).json({ message: 'Plate number already exists' }); return; }
    res.status(500).json({ message: e.message });
  }
});

apiRouter.delete('/trucks/:id', authMiddleware, roleGuard(['FARMER']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.truck.findFirst({ where: { id: req.params.id, ownerId: req.user!.userId } });
    if (!existing) { res.status(404).json({ message: 'Truck not found' }); return; }
    await prisma.truck.delete({ where: { id: req.params.id } });
    res.json({ message: 'Truck deleted' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.get('/admin/trucks', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { ownerId } = req.query;
    const where: any = {};
    if (ownerId) where.ownerId = ownerId as string;
    const trucks = await prisma.truck.findMany({
      where, include: { owner: { select: { name: true, email: true } } }, orderBy: { createdAt: 'desc' }
    });
    res.json({ trucks });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.post('/admin/trucks', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { plateNumber, make, model, capacity, color, ownerId } = req.body;
    if (!plateNumber || !make || !model || !capacity || !ownerId) {
      res.status(400).json({ message: 'plateNumber, make, model, capacity, ownerId are required' });
      return;
    }
    const truck = await prisma.truck.create({
      data: { plateNumber: plateNumber.toUpperCase(), make, model, capacity: Number(capacity), color, ownerId }
    });
    const result = await prisma.truck.findUnique({ where: { id: truck.id }, include: { owner: { select: { name: true, email: true } } } });
    res.status(201).json(result);
  } catch (e: any) {
    if (e.code === 'P2002') { res.status(409).json({ message: 'Plate number already exists' }); return; }
    res.status(500).json({ message: e.message });
  }
});

apiRouter.patch('/admin/trucks/:id', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { plateNumber, make, model, capacity, color, isArchived, ownerId } = req.body;
    const truck = await prisma.truck.update({
      where: { id: req.params.id },
      data: { ...(plateNumber && { plateNumber: plateNumber.toUpperCase() }), ...(make && { make }), ...(model && { model }), ...(capacity && { capacity: Number(capacity) }), ...(color !== undefined && { color }), ...(isArchived !== undefined && { isArchived }), ...(ownerId && { ownerId }) },
      include: { owner: { select: { name: true, email: true } } }
    });
    res.json(truck);
  } catch (e: any) {
    if (e.code === 'P2002') { res.status(409).json({ message: 'Plate number already exists' }); return; }
    res.status(500).json({ message: e.message }); }
});

apiRouter.delete('/admin/trucks/:id', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.truck.delete({ where: { id: req.params.id } });
    res.json({ message: 'Truck deleted' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// --- SUGARCANE VARIANT ROUTES ---
apiRouter.get('/variants', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const variants = await prisma.sugarcaneVariant.findMany({ orderBy: { name: 'asc' } });
    res.json({ variants });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.post('/variants', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, characteristics } = req.body;
    if (!name) { res.status(400).json({ message: 'Name is required' }); return; }
    const variant = await prisma.sugarcaneVariant.create({ data: { name, characteristics } });
    res.status(201).json(variant);
  } catch (e: any) {
    if (e.code === 'P2002') { res.status(409).json({ message: 'Variant name already exists' }); return; }
    res.status(500).json({ message: e.message });
  }
});

apiRouter.patch('/variants/:id', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, characteristics, isActive } = req.body;
    const variant = await prisma.sugarcaneVariant.update({
      where: { id: req.params.id },
      data: { ...(name && { name }), ...(characteristics !== undefined && { characteristics }), ...(isActive !== undefined && { isActive }) }
    });
    res.json(variant);
  } catch (e: any) {
    if (e.code === 'P2002') { res.status(409).json({ message: 'Variant name already exists' }); return; }
    res.status(500).json({ message: e.message });
  }
});

apiRouter.delete('/variants/:id', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.sugarcaneVariant.delete({ where: { id: req.params.id } });
    res.json({ message: 'Variant deleted' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// --- SUGAR TYPE ROUTES ---
apiRouter.get('/sugar-types', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const sugarTypes = await prisma.sugarType.findMany({ orderBy: { name: 'asc' } });
    res.json({ sugarTypes });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.post('/sugar-types', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    if (!name) { res.status(400).json({ message: 'Name is required' }); return; }
    const sugarType = await prisma.sugarType.create({ data: { name, description } });
    res.status(201).json(sugarType);
  } catch (e: any) {
    if (e.code === 'P2002') { res.status(409).json({ message: 'Sugar type name already exists' }); return; }
    res.status(500).json({ message: e.message });
  }
});

apiRouter.patch('/sugar-types/:id', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, isActive } = req.body;
    const sugarType = await prisma.sugarType.update({
      where: { id: req.params.id },
      data: { ...(name && { name }), ...(description !== undefined && { description }), ...(isActive !== undefined && { isActive }) }
    });
    res.json(sugarType);
  } catch (e: any) {
    if (e.code === 'P2002') { res.status(409).json({ message: 'Sugar type name already exists' }); return; }
    res.status(500).json({ message: e.message });
  }
});

apiRouter.delete('/sugar-types/:id', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.sugarType.delete({ where: { id: req.params.id } });
    res.json({ message: 'Sugar type deleted' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// --- PRICING ROUTES ---
apiRouter.get('/pricings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const pricings = await prisma.pricing.findMany({
      include: { variant: true, sugarType: true }, orderBy: { effectiveDate: 'desc' }
    });
    res.json({ pricings });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.post('/pricings', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { variantId, sugarTypeId, pricePerKg, effectiveDate } = req.body;
    if (!variantId || !sugarTypeId || pricePerKg == null) {
      res.status(400).json({ message: 'variantId, sugarTypeId, pricePerKg are required' });
      return;
    }
    const pricing = await prisma.pricing.create({
      data: { variantId, sugarTypeId, pricePerKg: Number(pricePerKg), effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined }
    });
    res.status(201).json(pricing);
  } catch (e: any) {
    if (e.code === 'P2002') { res.status(409).json({ message: 'Pricing for this variant + sugar type already exists' }); return; }
    res.status(500).json({ message: e.message });
  }
});

apiRouter.patch('/pricings/:id', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pricePerKg, effectiveDate, isActive } = req.body;
    const pricing = await prisma.pricing.update({
      where: { id: req.params.id },
      data: { ...(pricePerKg != null && { pricePerKg: Number(pricePerKg) }), ...(effectiveDate && { effectiveDate: new Date(effectiveDate) }), ...(isActive !== undefined && { isActive }) }
    });
    res.json(pricing);
  } catch (e: any) {
    if (e.code === 'P2002') { res.status(409).json({ message: 'Pricing for this variant + sugar type already exists' }); return; }
    res.status(500).json({ message: e.message });
  }
});

apiRouter.delete('/pricings/:id', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.pricing.delete({ where: { id: req.params.id } });
    res.json({ message: 'Pricing deleted' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// --- EXPENSE CATEGORY ROUTES ---
apiRouter.get('/expense-categories', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.expenseCategory.findMany({ orderBy: { name: 'asc' } });
    res.json({ categories });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.post('/expense-categories', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, type, description } = req.body;
    if (!name || !type) { res.status(400).json({ message: 'Name and type are required' }); return; }
    if (!['DELIVERY', 'FARM'].includes(type)) { res.status(400).json({ message: 'Type must be DELIVERY or FARM' }); return; }
    const category = await prisma.expenseCategory.create({ data: { name, type, description } });
    res.status(201).json(category);
  } catch (e: any) {
    if (e.code === 'P2002') { res.status(409).json({ message: 'Category name already exists' }); return; }
    res.status(500).json({ message: e.message });
  }
});

apiRouter.patch('/expense-categories/:id', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, type, description, isActive } = req.body;
    if (type && !['DELIVERY', 'FARM'].includes(type)) { res.status(400).json({ message: 'Type must be DELIVERY or FARM' }); return; }
    const category = await prisma.expenseCategory.update({
      where: { id: req.params.id },
      data: { ...(name && { name }), ...(type && { type }), ...(description !== undefined && { description }), ...(isActive !== undefined && { isActive }) }
    });
    res.json(category);
  } catch (e: any) {
    if (e.code === 'P2002') { res.status(409).json({ message: 'Category name already exists' }); return; }
    res.status(500).json({ message: e.message });
  }
});

apiRouter.delete('/expense-categories/:id', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.expenseCategory.delete({ where: { id: req.params.id } });
    res.json({ message: 'Category deleted' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// --- EXPENSE ROUTES ---
apiRouter.post('/expenses', authMiddleware, roleGuard(['FARMER']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { quedanId, categoryId, amount, receiptUrl, notes } = req.body;
    if (!quedanId || !categoryId || amount == null) {
      res.status(400).json({ message: 'quedanId, categoryId, amount are required' });
      return;
    }
    const expense = await prisma.expense.create({
      data: { quedanId, userId: req.user!.userId, categoryId, amount: Number(amount), receiptUrl, notes }
    });
    res.status(201).json(expense);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.get('/expenses', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { quedanId } = req.query;
    const where: any = {};
    if (req.user!.role === 'FARMER') where.userId = req.user!.userId;
    if (quedanId) where.quedanId = quedanId as string;
    const expenses = await prisma.expense.findMany({
      where, include: { category: true }, orderBy: { createdAt: 'desc' }
    });
    res.json({ expenses });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.patch('/expenses/:id', authMiddleware, roleGuard(['FARMER']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.expense.findFirst({ where: { id: req.params.id, userId: req.user!.userId } });
    if (!existing) { res.status(404).json({ message: 'Expense not found' }); return; }
    const { amount, receiptUrl, notes, categoryId } = req.body;
    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: { ...(amount != null && { amount: Number(amount) }), ...(receiptUrl !== undefined && { receiptUrl }), ...(notes !== undefined && { notes }), ...(categoryId && { categoryId }) }
    });
    res.json(expense);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.delete('/expenses/:id', authMiddleware, roleGuard(['FARMER']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.expense.findFirst({ where: { id: req.params.id, userId: req.user!.userId } });
    if (!existing) { res.status(404).json({ message: 'Expense not found' }); return; }
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ message: 'Expense deleted' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// --- FARM EXPENSE ROUTES ---
apiRouter.post('/farm-expenses', authMiddleware, roleGuard(['FARMER']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { farmId, categoryId, amount, receiptUrl, notes, date } = req.body;
    if (!farmId || !categoryId || amount == null) {
      res.status(400).json({ message: 'farmId, categoryId, amount are required' });
      return;
    }
    const farm = await prisma.farm.findFirst({ where: { id: farmId, ownerId: req.user!.userId } });
    if (!farm) { res.status(404).json({ message: 'Farm not found' }); return; }
    const farmExpense = await prisma.farmExpense.create({
      data: { farmId, categoryId, amount: Number(amount), receiptUrl, notes, date: date ? new Date(date) : undefined }
    });
    res.status(201).json(farmExpense);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.get('/farm-expenses', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId } = req.query;
    const where: any = {};
    if (req.user!.role === 'FARMER') where.farm = { ownerId: req.user!.userId };
    if (farmId) where.farmId = farmId as string;
    const expenses = await prisma.farmExpense.findMany({
      where, include: { category: true, farm: { select: { id: true, farmName: true } } }, orderBy: { date: 'desc' }
    });
    res.json({ farmExpenses: expenses });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.patch('/farm-expenses/:id', authMiddleware, roleGuard(['FARMER']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.farmExpense.findFirst({
      where: { id: req.params.id, farm: { ownerId: req.user!.userId } }
    });
    if (!existing) { res.status(404).json({ message: 'Farm expense not found' }); return; }
    const { amount, receiptUrl, notes, categoryId, date } = req.body;
    const expense = await prisma.farmExpense.update({
      where: { id: req.params.id },
      data: { ...(amount != null && { amount: Number(amount) }), ...(receiptUrl !== undefined && { receiptUrl }), ...(notes !== undefined && { notes }), ...(categoryId && { categoryId }), ...(date && { date: new Date(date) }) }
    });
    res.json(expense);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.delete('/farm-expenses/:id', authMiddleware, roleGuard(['FARMER']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.farmExpense.findFirst({
      where: { id: req.params.id, farm: { ownerId: req.user!.userId } }
    });
    if (!existing) { res.status(404).json({ message: 'Farm expense not found' }); return; }
    await prisma.farmExpense.delete({ where: { id: req.params.id } });
    res.json({ message: 'Farm expense deleted' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// --- PAYMENT ROUTES ---
apiRouter.post('/payments', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { quedanId, method, referenceNumber, grossAmount, deductions, netAmount, status, datePaid, proofUrl, notes } = req.body;
    if (!quedanId || !method || grossAmount == null || netAmount == null) {
      res.status(400).json({ message: 'quedanId, method, grossAmount, netAmount are required' });
      return;
    }
    const payment = await prisma.payment.create({
      data: { quedanId, method, referenceNumber, grossAmount: Number(grossAmount), deductions: Number(deductions || 0), netAmount: Number(netAmount), status: status || 'PENDING', datePaid: datePaid ? new Date(datePaid) : null, proofUrl, notes }
    });
    res.status(201).json(payment);
  } catch (e: any) {
    if (e.code === 'P2002') { res.status(409).json({ message: 'Payment for this quedan already exists' }); return; }
    res.status(500).json({ message: e.message });
  }
});

apiRouter.get('/payments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ payments });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.get('/payments/:quedanId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { quedanId: req.params.quedanId } });
    if (!payment) { res.status(404).json({ message: 'Payment not found' }); return; }
    res.json(payment);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.patch('/payments/:id', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { method, referenceNumber, grossAmount, deductions, netAmount, status, datePaid, proofUrl, notes } = req.body;
    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: { ...(method && { method }), ...(referenceNumber !== undefined && { referenceNumber }), ...(grossAmount != null && { grossAmount: Number(grossAmount) }), ...(deductions != null && { deductions: Number(deductions) }), ...(netAmount != null && { netAmount: Number(netAmount) }), ...(status && { status }), ...(datePaid !== undefined && { datePaid: datePaid ? new Date(datePaid) : null }), ...(proofUrl !== undefined && { proofUrl }), ...(notes !== undefined && { notes }) }
    });
    res.json(payment);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.delete('/payments/:id', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.payment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Payment deleted' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// --- TICKETS ROUTES ---
// Operator creates ticket
apiRouter.post('/tickets', authMiddleware, roleGuard(['FARMER']), async (req: AuthRequest, res: Response): Promise<void> => {
   try {
     const { truckPlate, farmId, grossWeight, tareWeight, notes, brix, pol, sampleCollected, sugarTypeId, variantId, truckId } = req.body;
     const millWeight = Number(grossWeight) - Number(tareWeight);
     
     if (millWeight <= 0) {
       res.status(400).json({ message: 'Invalid weights. Mill weight must be > 0.' });
       return;
     }

     const settings = await prisma.systemSettings.findFirst();
     const pricePerKg = settings ? settings.basePricePerKg : 2.50;
     
     // Generate QDN format quedan number
     const year = new Date().getFullYear();
     const count = await prisma.weightTicket.count();
     const ticketNo = `QDN-${year}-${String(count + 1).padStart(5, '0')}`;
     
     // Auto-compute purity
     let purity: number | undefined;
     if (brix != null && pol != null) {
       purity = Number(brix) > 0 ? (Number(pol) / Number(brix)) * 100 : 0;
     }
     
     const ticket = await prisma.weightTicket.create({
       data: {
         ticketNo,
         truckPlate,
         farmId,
         grossWeight: Number(grossWeight),
         tareWeight: Number(tareWeight),
         millWeight,
         pricePerKg,
         totalValue: millWeight * pricePerKg,
         status: 'PENDING',
         notes,
         farmerId: req.user!.userId,
         brix: brix != null ? Number(brix) : undefined,
         pol: pol != null ? Number(pol) : undefined,
         purity: purity != null ? Math.round(purity * 100) / 100 : undefined,
         sampleCollected: sampleCollected === true,
         sugarTypeId: sugarTypeId || undefined,
         variantId: variantId || undefined,
         truckId: truckId || undefined
       },
       include: { farm: true }
     });

     await prisma.notification.create({
        data: {
          userId: ticket.farm.ownerId,
          type: 'SUCCESS',
          message: `New ticket ${ticket.ticketNo} recorded for truck ${truckPlate} (${millWeight}kg).`
        }
      });

     await writeAuditLog(req.user!.userId, 'CREATE_TICKET', ticket.id, 'WeightTicket');
     res.status(201).json(ticket);
   } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// List tickets
apiRouter.get('/tickets', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status, farmId } = req.query;
    let where: any = {};
    if (status) where.status = status;
    
    if (req.user!.role === 'FARMER') {
      const farms = await prisma.farm.findMany({ where: { ownerId: req.user!.userId }});
      where.farmId = { in: farms.map(f => f.id) };
    } else if (farmId) {
      where.farmId = farmId;
    }
    
    const tickets = await prisma.weightTicket.findMany({
      where,
      include: { 
        farm: true, 
        farmer: { select: { name: true, assignedMill: true } }, 
        reconciliation: true,
        sugarType: true,
        variant: true,
        truck: true,
        deliveryReceipts: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ tickets });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// Single ticket details with timeline
apiRouter.get('/tickets/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.weightTicket.findUnique({
      where: { id },
      include: {
        farm: { include: { owner: { select: { name: true, email: true, contactNumber: true, address: true } } } },
        farmer: { select: { name: true, email: true, contactNumber: true, assignedMill: true } },
        reconciliation: { include: { admin: { select: { name: true, email: true, contactNumber: true } } } },
        sugarType: true,
        variant: true,
        truck: true,
        deliveryReceipts: true,
        sugarType: true,
        variant: true,
        truck: true
      }
    });
    if (!ticket) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }

    // Farmers can only view their own tickets
    if (req.user!.role === 'FARMER') {
      const farms = await prisma.farm.findMany({ where: { ownerId: req.user!.userId }, select: { id: true } });
      const farmIds = farms.map(f => f.id);
      if (!farmIds.includes(ticket.farmId)) {
        res.status(403).json({ message: 'Access denied' });
        return;
      }
    }

    const timeline = [];
    timeline.push({
      type: 'CREATED',
      date: ticket.createdAt,
      label: 'Ticket Created',
      description: `Ticket ${ticket.ticketNo} was encoded by ${ticket.farmer?.name || 'Farmer'}`
    });

    if (ticket.reconciliation) {
      timeline.push({
        type: ticket.status === 'DISPUTED' ? 'FLAGGED' : 'RECONCILED',
        date: ticket.reconciliation.reconciledAt,
        label: ticket.status === 'DISPUTED' ? 'Variance Flagged' : 'Weight Reconciled',
        description: ticket.status === 'DISPUTED'
          ? `Variance of ${Math.abs(ticket.reconciliation.difference)}kg (${ticket.reconciliation.percentDiff.toFixed(2)}%) flagged for review`
          : `Refinery weight: ${ticket.reconciliation.refineryWeight}kg (${ticket.reconciliation.difference > 0 ? '+' : ''}${ticket.reconciliation.difference}kg variance)`
      });

      if (ticket.reconciliation.resolvedAt) {
        timeline.push({
          type: 'RESOLVED',
          date: ticket.reconciliation.resolvedAt,
          label: 'Dispute Resolved',
          description: ticket.reconciliation.notes || 'Dispute was resolved by administrator'
        });
      }
    }

    if (ticket.updatedAt) {
      timeline.push({
        type: 'UPDATED',
        date: ticket.updatedAt,
        label: 'Last Updated',
        description: `Ticket was last modified`
      });
    }

    res.json({ ticket, timeline });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// Update ticket (admin can update any, farmer can update own PENDING)
apiRouter.patch('/tickets/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticket = await prisma.weightTicket.findUnique({ where: { id: req.params.id } });
    if (!ticket) { res.status(404).json({ message: 'Ticket not found' }); return; }

    if (req.user!.role === 'FARMER') {
      const farms = await prisma.farm.findMany({ where: { ownerId: req.user!.userId }, select: { id: true } });
      const farmIds = farms.map(f => f.id);
      if (!farmIds.includes(ticket.farmId)) { res.status(403).json({ message: 'Access denied' }); return; }
      if (ticket.status !== 'PENDING') { res.status(400).json({ message: 'Can only edit PENDING tickets' }); return; }
    }

    const { truckPlate, grossWeight, tareWeight, notes, brix, pol, sampleCollected, sugarTypeId, variantId, truckId, status, adjustedWeight, adjustedPrice, disputeNotes, disputeFinal } = req.body;
    const updateData: any = {};
    if (truckPlate) updateData.truckPlate = truckPlate;
    if (grossWeight != null) updateData.grossWeight = Number(grossWeight);
    if (tareWeight != null) updateData.tareWeight = Number(tareWeight);
    if (grossWeight != null && tareWeight != null) {
      updateData.millWeight = Number(grossWeight) - Number(tareWeight);
      updateData.totalValue = updateData.millWeight * (ticket.pricePerKg);
    }
    if (notes !== undefined) updateData.notes = notes;
    if (brix !== undefined) updateData.brix = brix != null ? Number(brix) : null;
    if (pol !== undefined) updateData.pol = pol != null ? Number(pol) : null;
    if (brix !== undefined || pol !== undefined) {
      const bVal = brix !== undefined ? (brix != null ? Number(brix) : null) : ticket.brix;
      const pVal = pol !== undefined ? (pol != null ? Number(pol) : null) : ticket.pol;
      updateData.purity = (bVal && pVal && bVal > 0) ? Math.round((pVal / bVal) * 10000) / 100 : null;
    }
    if (sampleCollected !== undefined) updateData.sampleCollected = sampleCollected === true;
    if (sugarTypeId !== undefined) updateData.sugarTypeId = sugarTypeId || null;
    if (variantId !== undefined) updateData.variantId = variantId || null;
    if (truckId !== undefined) updateData.truckId = truckId || null;
    if (status && ['PENDING', 'VERIFIED', 'RECONCILED', 'DISPUTED', 'PAID'].includes(status)) updateData.status = status;
    if (adjustedWeight !== undefined) updateData.adjustedWeight = adjustedWeight != null ? Number(adjustedWeight) : null;
    if (adjustedPrice !== undefined) updateData.adjustedPrice = adjustedPrice != null ? Number(adjustedPrice) : null;
    if (disputeNotes !== undefined) updateData.disputeNotes = disputeNotes;
    if (disputeFinal !== undefined) updateData.disputeFinal = disputeFinal === true;

    if (req.user!.role === 'ADMIN' && status === 'VERIFIED') {
      updateData.verifiedAt = new Date();
      updateData.verifiedBy = req.user!.userId;
    }

    const updated = await prisma.weightTicket.update({
      where: { id: req.params.id }, data: updateData,
      include: { farm: true, sugarType: true, variant: true, truck: true }
    });
    await writeAuditLog(req.user!.userId, 'UPDATE_TICKET', updated.id, 'WeightTicket');
    res.json(updated);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// --- RECONCILIATION ROUTES ---
apiRouter.post('/reconciliation/:ticketId', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const { refineryWeight, notes } = req.body;
    
    const ticket = await prisma.weightTicket.findUnique({ where: { id: ticketId }});
    if (!ticket) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }
    if (ticket.status === 'RECONCILED' || ticket.status === 'DISPUTED') {
      res.status(400).json({ message: 'Ticket is already processed' });
      return;
    }

    const difference = ticket.millWeight - Number(refineryWeight);
    const percentDiff = Math.abs(difference / ticket.millWeight) * 100;
    
    const settings = await prisma.systemSettings.findFirst();
    const activeThreshold = settings ? settings.varianceThreshold : THRESHOLD;
    
    const flagged = Math.abs(difference) > activeThreshold;
    const newStatus = flagged ? 'DISPUTED' : 'RECONCILED';

    const record = await prisma.reconciliationRecord.create({
      data: {
        ticketId,
        refineryWeight: Number(refineryWeight),
        difference,
        percentDiff,
        flagged,
        notes,
        adminId: req.user!.userId
      }
    });

    const updatedTicket = await prisma.weightTicket.update({
      where: { id: ticketId },
      data: { 
         status: newStatus,
         verifiedAt: new Date(),
      },
      include: { farm: true }
    });

    await prisma.notification.create({
      data: {
        userId: updatedTicket.farm.ownerId,
        type: flagged ? 'DISPUTE' : 'SUCCESS',
        message: flagged 
           ? `Ticket ${updatedTicket.ticketNo}: variance of ${Math.abs(difference).toFixed(1)}kg flagged. Awaiting admin resolution.`
           : `Ticket ${updatedTicket.ticketNo} reconciled successfully.`
      }
    });

    // Notify admins about the dispute
    if (flagged) {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'WARNING',
            message: `Dispute detected on ticket ${updatedTicket.ticketNo} (${Math.abs(difference).toFixed(1)}kg variance).`
          }
        });
      }
    }

    await writeAuditLog(req.user!.userId, flagged ? 'RECONCILE_DISPUTED' : 'RECONCILE_OK', record.id, 'ReconciliationRecord');
    
    res.status(201).json({ record, newStatus, difference, flagged });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.get('/reconciliation', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const records = await prisma.reconciliationRecord.findMany({
      include: {
        ticket: {
          include: { farm: true }
        },
        admin: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ records });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// Resolve Dispute
apiRouter.patch('/reconciliation/:id/resolve', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { resolutionNotes } = req.body;
    
    const record = await prisma.reconciliationRecord.update({
       where: { id },
       data: { 
         resolvedAt: new Date(),
         notes: resolutionNotes ? resolutionNotes : undefined
       }
    });
    
    const ticket = await prisma.weightTicket.update({
      where: { id: record.ticketId },
      data: { status: 'RECONCILED' },
      include: { farm: true }
    });

    await prisma.notification.create({
      data: {
        userId: ticket.farm.ownerId,
        type: 'RESOLVED',
        message: `Admin resolved dispute on ticket ${ticket.ticketNo}.${resolutionNotes ? ` Note: ${resolutionNotes}` : ''}`
      }
    });

    await writeAuditLog(req.user!.userId, 'RESOLVE_DISPUTE', record.id, 'ReconciliationRecord');
    res.json({ message: 'Dispute resolved', record });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// --- DELIVERY RECEIPT ROUTES ---
apiRouter.post('/delivery-receipts', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { quedanId, imageUrl } = req.body;
    if (!quedanId || !imageUrl) { res.status(400).json({ message: 'quedanId and imageUrl are required' }); return; }
    const receipt = await prisma.deliveryReceipt.create({ data: { quedanId, imageUrl } });
    res.status(201).json(receipt);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.get('/delivery-receipts/:quedanId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const receipts = await prisma.deliveryReceipt.findMany({ where: { quedanId: req.params.quedanId }, orderBy: { createdAt: 'desc' } });
    res.json({ receipts });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.delete('/delivery-receipts/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.deliveryReceipt.delete({ where: { id: req.params.id } });
    res.json({ message: 'Receipt deleted' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// --- FARMS & USERS ---
// All active farms (for dropdown)
apiRouter.get('/farms', authMiddleware, async (req: AuthRequest, res: Response) => {
   try {
     const farms = await prisma.farm.findMany({
       where: { isArchived: false },
       include: { owner: { select: { name: true, assignedMill: true } } }
     });
     res.json({ farms });
   } catch(e: any) { res.status(500).json({ message: e.message }); }
});

// Farmer's own farms
apiRouter.get('/farms/mine', authMiddleware, roleGuard(['FARMER']), async (req: AuthRequest, res: Response) => {
  try {
    const farms = await prisma.farm.findMany({
      where: { ownerId: req.user!.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ farms });
  } catch(e: any) { res.status(500).json({ message: e.message }); }
});

// Create a farm (FARMER only)
apiRouter.post('/farms', authMiddleware, roleGuard(['FARMER']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { farmName, location, barangay, hectares, cropType, description, documentUrls } = req.body;
    if (!farmName || !location) {
      res.status(400).json({ message: 'Farm name and location are required' });
      return;
    }
    const farm = await prisma.farm.create({
      data: {
        farmName,
        location,
        barangay: barangay || null,
        hectares: hectares ? Number(hectares) : null,
        cropType: cropType || null,
        description: description || null,
        ownerId: req.user!.userId,
        verificationStatus: 'PENDING'
      }
    });
    if (documentUrls && Array.isArray(documentUrls)) {
      for (const url of documentUrls) {
        await prisma.verificationDocument.create({
          data: { userId: req.user!.userId, documentType: 'LAND_TITLE', imageUrl: url, farmId: farm.id, status: 'PENDING' }
        });
      }
    }
    await writeAuditLog(req.user!.userId, 'CREATE_FARM', farm.id, 'Farm');
    res.status(201).json(farm);
  } catch(e: any) { res.status(500).json({ message: e.message }); }
});

// Update a farm (owner only)
apiRouter.patch('/farms/:id', authMiddleware, roleGuard(['FARMER']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const farm = await prisma.farm.findUnique({ where: { id } });
    if (!farm || farm.ownerId !== req.user!.userId) {
      res.status(404).json({ message: 'Farm not found' });
      return;
    }
    const { farmName, location, barangay, hectares, cropType, description } = req.body;
    const updated = await prisma.farm.update({
      where: { id },
      data: {
        ...(farmName !== undefined && { farmName }),
        ...(location !== undefined && { location }),
        ...(barangay !== undefined && { barangay }),
        ...(hectares !== undefined && { hectares: Number(hectares) }),
        ...(cropType !== undefined && { cropType }),
        ...(description !== undefined && { description }),
      }
    });
    await writeAuditLog(req.user!.userId, 'UPDATE_FARM', id, 'Farm');
    res.json(updated);
  } catch(e: any) { res.status(500).json({ message: e.message }); }
});

// Archive/Unarchive a farm (owner only)
apiRouter.patch('/farms/:id/archive', authMiddleware, roleGuard(['FARMER']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const farm = await prisma.farm.findUnique({ where: { id } });
    if (!farm || farm.ownerId !== req.user!.userId) {
      res.status(404).json({ message: 'Farm not found' });
      return;
    }
    const updated = await prisma.farm.update({
      where: { id },
      data: { isArchived: !farm.isArchived }
    });
    await writeAuditLog(req.user!.userId, updated.isArchived ? 'ARCHIVE_FARM' : 'UNARCHIVE_FARM', id, 'Farm');
    res.json(updated);
  } catch(e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.get('/users', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response) => {
   try {
      const users = await prisma.user.findMany({
         select: { id: true, name: true, email: true, role: true, isActive: true, contactNumber: true, address: true, verificationStatus: true, assignedMill: true, rejectionReason: true, createdAt: true, updatedAt: true },
        orderBy: { createdAt: 'desc' }
      });
     res.json({ users });
   } catch(e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.patch('/users/:id/status', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response) => {
   try {
     const { id } = req.params;
     const { isActive } = req.body;
      await prisma.user.update({ where: { id }, data: { isActive } });
      await writeAuditLog(req.user!.userId, isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER', id, 'User');
      res.json({ message: 'User status updated' });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.patch('/users/:id/password', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
     const { id } = req.params;
     // Allow only if user is updating their own password OR is admin
     if (id !== req.user!.userId && req.user!.role !== 'ADMIN') {
       res.status(403).json({ message: 'Access denied' });
       return;
     }
     const { password } = req.body;
     const passwordHash = await bcrypt.hash(password, 10);
      await prisma.user.update({ where: { id }, data: { passwordHash } });
      await writeAuditLog(req.user!.userId, 'PASSWORD_CHANGE', id, 'User');
      res.json({ message: 'Password updated successfully' });
   } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.delete('/users/:id', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
     const { id } = req.params;
     if (id === req.user!.userId) {
       res.status(400).json({ message: 'Cannot delete your own account' });
       return;
     }
     const user = await prisma.user.findUnique({ where: { id } });
     if (!user) {
       res.status(404).json({ message: 'User not found' });
       return;
     }

     // Delete notifications
     await prisma.notification.deleteMany({ where: { userId: id } });
     // Delete audit logs
     await prisma.auditLog.deleteMany({ where: { userId: id } });
      // Delete reconciliation records where user is admin
      await prisma.reconciliationRecord.deleteMany({ where: { adminId: id } });

      // Delete tickets & their reconciliations where user is farmer
      const tickets = await prisma.weightTicket.findMany({ where: { farmerId: id }, select: { id: true } });
      for (const t of tickets) {
        await prisma.reconciliationRecord.deleteMany({ where: { ticketId: t.id } });
      }
      await prisma.weightTicket.deleteMany({ where: { farmerId: id } });

     // Delete farms & their tickets & reconciliations where user is farmer
     const farms = await prisma.farm.findMany({ where: { ownerId: id }, select: { id: true } });
     for (const farm of farms) {
       const farmTickets = await prisma.weightTicket.findMany({ where: { farmId: farm.id }, select: { id: true } });
       for (const t of farmTickets) {
         await prisma.reconciliationRecord.deleteMany({ where: { ticketId: t.id } });
       }
       await prisma.weightTicket.deleteMany({ where: { farmId: farm.id } });
     }
     await prisma.farm.deleteMany({ where: { ownerId: id } });

     // Finally delete the user
     await prisma.user.delete({ where: { id } });

     await writeAuditLog(req.user!.userId, 'DELETE_USER', id, 'User');
     res.json({ message: 'User deleted successfully' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// --- SETTINGS ---
apiRouter.get('/settings', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response) => {
   try {
     let settings = await prisma.systemSettings.findFirst();
     if (!settings) {
        settings = await prisma.systemSettings.create({ data: { varianceThreshold: 50, basePricePerKg: 2.50 } });
     }
     res.json({ settings });
   } catch(e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.post('/settings', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response) => {
   try {
     const { varianceThreshold, basePricePerKg } = req.body;
     let settings = await prisma.systemSettings.findFirst();
     if (settings) {
        settings = await prisma.systemSettings.update({
            where: { id: settings.id },
            data: { varianceThreshold, basePricePerKg }
        });
     } else {
        settings = await prisma.systemSettings.create({ data: { varianceThreshold, basePricePerKg } });
     }
     res.json({ settings });
   } catch(e: any) { res.status(500).json({ message: e.message }); }
});

// --- AUDIT LOGS ---
apiRouter.get('/audit-logs', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, action, dateFrom, dateTo, search, page = '1', limit = '50' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * pageSize;

    let where: any = {};

    // Non-admin users can only see their own logs
    if (req.user!.role !== 'ADMIN') {
      where.userId = req.user!.userId;
    } else if (userId) {
      where.userId = userId as string;
    }

    if (action) {
      where.action = action as string;
    }

    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = new Date(dateFrom as string);
      if (dateTo) where.timestamp.lte = new Date(dateTo as string);
    }

    if (search) {
      where.OR = [
        { action: { contains: search as string } },
        { targetType: { contains: search as string } },
        { targetId: { contains: search as string } },
        { user: { name: { contains: search as string } } }
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, role: true } }
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// Get distinct action types (for filter dropdown)
apiRouter.get('/audit-logs/actions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' }
    });
    res.json({ actions: logs.map(l => l.action) });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

apiRouter.get('/notifications', authMiddleware, async (req: AuthRequest, res: Response) => {
   try {
     const { page = '1', limit = '20' } = req.query;
     const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
     const pageSize = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
     const skip = (pageNum - 1) * pageSize;

     const [notifications, total] = await Promise.all([
       prisma.notification.findMany({
         where: { userId: req.user!.userId },
         orderBy: { createdAt: 'desc' },
         skip,
         take: pageSize
       }),
       prisma.notification.count({ where: { userId: req.user!.userId } })
     ]);

     res.json({
       notifications,
       pagination: {
         page: pageNum,
         limit: pageSize,
         total,
         totalPages: Math.ceil(total / pageSize)
       }
     });
   } catch(e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.get('/notifications/unread-count', authMiddleware, async (req: AuthRequest, res: Response) => {
   try {
     const count = await prisma.notification.count({
       where: { userId: req.user!.userId, read: false }
     });
     res.json({ count });
   } catch(e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.patch('/notifications/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
   try {
     const { id } = req.params;
     const notification = await prisma.notification.findUnique({ where: { id } });
     if (!notification || notification.userId !== req.user!.userId) {
       res.status(404).json({ message: 'Notification not found' });
       return;
     }
     await prisma.notification.update({ where: { id }, data: { read: true } });
     res.json({ message: 'Marked as read' });
   } catch(e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.patch('/notifications/:id/unread', authMiddleware, async (req: AuthRequest, res: Response) => {
   try {
     const { id } = req.params;
     const notification = await prisma.notification.findUnique({ where: { id } });
     if (!notification || notification.userId !== req.user!.userId) {
       res.status(404).json({ message: 'Notification not found' });
       return;
     }
     await prisma.notification.update({ where: { id }, data: { read: false } });
     res.json({ message: 'Marked as unread' });
   } catch(e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.patch('/notifications/read-all', authMiddleware, async (req: AuthRequest, res: Response) => {
   try {
     await prisma.notification.updateMany({
       where: { userId: req.user!.userId, read: false },
       data: { read: true }
     });
     res.json({ message: 'All notifications marked as read' });
   } catch(e: any) { res.status(500).json({ message: e.message }); }
});

// --- SUMMARY STATS ---
apiRouter.get('/summary', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let whereClause: any = {};
    if (req.user!.role === 'FARMER') {
      const farms = await prisma.farm.findMany({ where: { ownerId: req.user!.userId } });
      whereClause = { farmId: { in: farms.map(f => f.id) } };
    }

    const total = await prisma.weightTicket.count({ where: whereClause });
    const reconciled = await prisma.weightTicket.count({ where: { ...whereClause, status: 'RECONCILED' } });
    const disputed = await prisma.weightTicket.count({ where: { ...whereClause, status: 'DISPUTED' } });
    const valAgg = await prisma.weightTicket.aggregate({ 
      where: whereClause,
      _sum: { totalValue: true, millWeight: true } 
    });
    
    res.json({
      totalTickets: total,
      reconciled,
      disputed,
      pending: total - reconciled - disputed,
      totalValue: valAgg._sum.totalValue || 0,
      totalWeight: valAgg._sum.millWeight || 0
    });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});
