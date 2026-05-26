import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID, randomInt } from 'crypto';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const pendingRegistrations = new Map<string, { name: string; email: string; passwordHash: string; contactNumber: string | null; address: string | null; farmName: string | null; farmLocation: string | null; code: string; expiresAt: number }>();

const cleanupPending = setInterval(() => {
  const now = Date.now();
  for (const [email, reg] of pendingRegistrations) {
    if (reg.expiresAt < now) pendingRegistrations.delete(email);
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
    const { name, email, password, contactNumber, address, farmName, farmLocation } = req.body;

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
      farmName: farmName || null, farmLocation: farmLocation || null, code,
      expiresAt: Date.now() + 600000
    });

    try {
      await transporter.sendMail({
        from: `"CaneTrack" <${process.env.EMAIL_USER}>`,
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
      });
    } catch (emailErr) {
      pendingRegistrations.delete(email);
      console.error('Failed to send verification email:', emailErr);
      res.status(500).json({ message: 'Failed to send verification email. Check your email credentials.' });
      return;
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
        emailVerified: true, verificationCode: null
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

    pendingRegistrations.delete(email);
    res.json({ message: 'Email verified successfully! You can now sign in.' });
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
    await transporter.sendMail({
      from: `"CaneTrack" <${process.env.EMAIL_USER}>`,
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
    });
    res.json({ message: 'New verification code sent' });
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
    const token = jwt.sign({ userId: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
    await writeAuditLog(user.id, 'LOGIN', user.id, 'User');
    res.json({ token, user: { id: user.id, userId: user.id, name: user.name, email: user.email, role: user.role, contactNumber: user.contactNumber, address: user.address, profilePicture: user.profilePicture } });
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

// --- TICKETS ROUTES ---
// Operator creates ticket
apiRouter.post('/tickets', authMiddleware, roleGuard(['OPERATOR']), async (req: AuthRequest, res: Response): Promise<void> => {
   try {
     const { truckPlate, farmId, grossWeight, tareWeight, notes } = req.body;
     const millWeight = Number(grossWeight) - Number(tareWeight);
     
     if (millWeight <= 0) {
       res.status(400).json({ message: 'Invalid weights. Mill weight must be > 0.' });
       return;
     }

     const settings = await prisma.systemSettings.findFirst();
     const pricePerKg = settings ? settings.basePricePerKg : 2.50; // Dynamic base price
     
     const ticket = await prisma.weightTicket.create({
       data: {
         ticketNo: `TKT-${Math.floor(Math.random() * 1000000)}`,
         truckPlate,
         farmId,
         grossWeight: Number(grossWeight),
         tareWeight: Number(tareWeight),
         millWeight,
         pricePerKg,
         totalValue: millWeight * pricePerKg,
         status: 'PENDING',
         notes,
         operatorId: req.user!.userId
       },
       include: {
         farm: true
       }
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
        operator: { select: { name: true } }, 
        reconciliation: true 
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
        operator: { select: { name: true, email: true, contactNumber: true } },
        reconciliation: { include: { receiver: { select: { name: true, email: true, contactNumber: true } } } }
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
      description: `Ticket ${ticket.ticketNo} was encoded by ${ticket.operator?.name || 'Operator'}`
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

// --- RECONCILIATION ROUTES ---
apiRouter.post('/reconciliation/:ticketId', authMiddleware, roleGuard(['RECEIVER']), async (req: AuthRequest, res: Response): Promise<void> => {
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
        receiverId: req.user!.userId
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

apiRouter.get('/reconciliation', authMiddleware, roleGuard(['ADMIN', 'RECEIVER']), async (req: AuthRequest, res: Response) => {
  try {
    const records = await prisma.reconciliationRecord.findMany({
      include: {
        ticket: {
          include: { farm: true }
        },
        receiver: { select: { name: true } }
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

// --- FARMS & USERS ---
// All active farms (for operator dropdown)
apiRouter.get('/farms', authMiddleware, async (req: AuthRequest, res: Response) => {
   try {
     const farms = await prisma.farm.findMany({
       where: { isArchived: false },
       include: { owner: { select: { name: true } } }
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
    const { farmName, location, barangay, hectares, cropType, description } = req.body;
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
        ownerId: req.user!.userId
      }
    });
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
        select: { id: true, name: true, email: true, role: true, isActive: true, contactNumber: true, address: true, createdAt: true, updatedAt: true },
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
     // Delete reconciliation records where user is receiver
     await prisma.reconciliationRecord.deleteMany({ where: { receiverId: id } });

     // Delete tickets & their reconciliations where user is operator
     const opTickets = await prisma.weightTicket.findMany({ where: { operatorId: id }, select: { id: true } });
     for (const t of opTickets) {
       await prisma.reconciliationRecord.deleteMany({ where: { ticketId: t.id } });
     }
     await prisma.weightTicket.deleteMany({ where: { operatorId: id } });

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
