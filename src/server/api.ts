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

const pendingRegistrations = new Map<string, { name: string; email: string; passwordHash: string; contactNumber: string | null; address: string | null; code: string; expiresAt: number }>();
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

// --- TYPES ---
export interface AuthRequest extends Request {
  user?: { userId: string };
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
    req.user = { userId: decoded.userId };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// --- AUTH ROUTES ---
apiRouter.post('/auth/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, contactNumber, address, assignedMill } = req.body;

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

    const passwordHash = await bcrypt.hash(password, 10);
    const code = String(randomInt(100000, 999999));

    if (pendingRegistrations.has(email)) {
      pendingRegistrations.delete(email);
    }

    pendingRegistrations.set(email, {
      name, email, passwordHash, contactNumber: contactNumber || null, address: address || null, code,
      expiresAt: Date.now() + 600000
    });

    try {
      await sgMail.send({
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
            <p style="color:#94a3b8;font-size:12px;">If you didn't request this, ignore this email.</p>
          </div>
        `
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
        contactNumber: pending.contactNumber, address: pending.address,
        emailVerified: true, verificationCode: null
      },
      select: { id: true, name: true, email: true, contactNumber: true, address: true, profilePicture: true }
    });
    await prisma.farm.create({
      data: {
        farmName: `${pending.name}'s Farm`,
        location: 'Local Region',
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
    try {
      await sgMail.send({
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
      });
    } catch (emailErr) {
      console.error('Resend email failed:', emailErr);
    }
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
    try {
      await sgMail.send({
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
      });
    } catch (emailErr) {
      console.error('Forgot password email failed:', emailErr);
    }
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

apiRouter.post('/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    if (!user.emailVerified) {
      res.status(403).json({ message: 'Please verify your email first. Check your inbox for the verification code.' });
      return;
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, userId: user.id, name: user.name, email: user.email, contactNumber: user.contactNumber, address: user.address, profilePicture: user.profilePicture } });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

apiRouter.post('/auth/logout', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ message: 'Logged out successfully' });
});

apiRouter.get('/auth/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        include: { farms: { select: { id: true, farmName: true, location: true, barangay: true, hectares: true, cropType: true, description: true, isArchived: true } } }
      });
      if (!user) { res.status(404).json({ message: 'User not found' }); return; }
      res.json({ user: { id: user.id, userId: user.id, name: user.name, email: user.email, contactNumber: user.contactNumber, address: user.address, profilePicture: user.profilePicture, farms: user.farms } });
  } catch(e: any) { res.status(500).json({ message: e.message }); }
});

// --- PROFILE ROUTES ---
apiRouter.get('/users/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { farms: { select: { id: true, farmName: true, location: true, barangay: true, hectares: true, cropType: true, description: true, isArchived: true } } }
    });
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    res.json({ user: { id: user.id, userId: user.id, name: user.name, email: user.email, contactNumber: user.contactNumber, address: user.address, profilePicture: user.profilePicture, farms: user.farms } });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.patch('/users/profile', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, contactNumber, address, profilePicture } = req.body;

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
      select: { id: true, name: true, email: true, contactNumber: true, address: true, profilePicture: true }
    });

    res.json({ message: 'Profile updated successfully', user });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// --- FILE UPLOAD ---
apiRouter.post('/upload', (req: Request, res: Response): void => {
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

// --- BAGON ROUTES ---
apiRouter.post('/bagon', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { plateNumber, type, tareWeight } = req.body;
    if (!plateNumber) {
      res.status(400).json({ message: 'Plate number is required' });
      return;
    }
    const validTypes = ['14ft', '18ft', '20ft'];
    if (type && !validTypes.includes(type)) {
      res.status(400).json({ message: 'Type must be 14ft, 18ft, or 20ft' });
      return;
    }
    const bagon = await prisma.bagon.create({
      data: { plateNumber: plateNumber.toUpperCase(), type: type || '18ft', tareWeight: tareWeight ? Number(tareWeight) : null, ownerId: req.user!.userId }
    });
    res.status(201).json(bagon);
  } catch (e: any) {
    if (e.code === 'P2002') { res.status(409).json({ message: 'Plate number already exists' }); return; }
    res.status(500).json({ message: e.message });
  }
});

apiRouter.get('/bagon', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const bagons = await prisma.bagon.findMany({ where: { ownerId: req.user!.userId }, orderBy: { createdAt: 'desc' } });
    res.json({ bagons });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.get('/bagon/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const bagon = await prisma.bagon.findFirst({ where: { id: req.params.id, ownerId: req.user!.userId } });
    if (!bagon) { res.status(404).json({ message: 'Bagon not found' }); return; }
    res.json(bagon);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.patch('/bagon/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.bagon.findFirst({ where: { id: req.params.id, ownerId: req.user!.userId } });
    if (!existing) { res.status(404).json({ message: 'Bagon not found' }); return; }
    const { plateNumber, type, tareWeight, isArchived } = req.body;
    const validTypes = ['14ft', '18ft', '20ft'];
    if (type && !validTypes.includes(type)) {
      res.status(400).json({ message: 'Type must be 14ft, 18ft, or 20ft' });
      return;
    }
    const bagon = await prisma.bagon.update({
      where: { id: req.params.id },
      data: { ...(plateNumber && { plateNumber: plateNumber.toUpperCase() }), ...(type && { type }), ...(tareWeight !== undefined && { tareWeight: tareWeight ? Number(tareWeight) : null }), ...(isArchived !== undefined && { isArchived }) }
    });
    res.json(bagon);
  } catch (e: any) {
    if (e.code === 'P2002') { res.status(409).json({ message: 'Plate number already exists' }); return; }
    res.status(500).json({ message: e.message });
  }
});

apiRouter.delete('/bagon/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.bagon.findFirst({ where: { id: req.params.id, ownerId: req.user!.userId } });
    if (!existing) { res.status(404).json({ message: 'Bagon not found' }); return; }
    await prisma.bagon.delete({ where: { id: req.params.id } });
    res.json({ message: 'Bagon deleted' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// --- EXPENSE CATEGORY ROUTES ---
apiRouter.get('/expense-categories', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.expenseCategory.findMany({ orderBy: { name: 'asc' } });
    res.json({ categories });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// --- EXPENSE ROUTES ---
apiRouter.post('/expenses', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
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
    const where: any = { userId: req.user!.userId };
    if (quedanId) where.quedanId = quedanId as string;
    const expenses = await prisma.expense.findMany({
      where, include: { category: true }, orderBy: { createdAt: 'desc' }
    });
    res.json({ expenses });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.patch('/expenses/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
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

apiRouter.delete('/expenses/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.expense.findFirst({ where: { id: req.params.id, userId: req.user!.userId } });
    if (!existing) { res.status(404).json({ message: 'Expense not found' }); return; }
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ message: 'Expense deleted' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// --- FARM EXPENSE ROUTES ---
apiRouter.post('/farm-expenses', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
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
    const where: any = { farm: { ownerId: req.user!.userId } };
    if (farmId) where.farmId = farmId as string;
    const expenses = await prisma.farmExpense.findMany({
      where, include: { category: true, farm: { select: { id: true, farmName: true } } }, orderBy: { date: 'desc' }
    });
    res.json({ farmExpenses: expenses });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.patch('/farm-expenses/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
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

apiRouter.delete('/farm-expenses/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
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
apiRouter.post('/payments', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
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

apiRouter.patch('/payments/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { method, referenceNumber, grossAmount, deductions, netAmount, status, datePaid, proofUrl, notes } = req.body;
    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: { ...(method && { method }), ...(referenceNumber !== undefined && { referenceNumber }), ...(grossAmount != null && { grossAmount: Number(grossAmount) }), ...(deductions != null && { deductions: Number(deductions) }), ...(netAmount != null && { netAmount: Number(netAmount) }), ...(status && { status }), ...(datePaid !== undefined && { datePaid: datePaid ? new Date(datePaid) : null }), ...(proofUrl !== undefined && { proofUrl }), ...(notes !== undefined && { notes }) }
    });
    res.json(payment);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.delete('/payments/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.payment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Payment deleted' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// --- TICKETS ROUTES ---
apiRouter.post('/tickets', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
   try {
     const { bagonId, farmId, grossWeight, tareWeight, brix, pol, sampleCollected, notes } = req.body;

     if (!bagonId || !farmId || grossWeight == null || tareWeight == null) {
       res.status(400).json({ message: 'bagonId, farmId, grossWeight, tareWeight are required' });
       return;
     }

     const netWeight = Number(grossWeight) - Number(tareWeight);
     if (netWeight <= 0) {
       res.status(400).json({ message: 'Invalid weights. Net weight must be > 0.' });
       return;
     }

     const year = new Date().getFullYear();
     const count = await prisma.weightTicket.count();
     const ticketNo = `QDN-${year}-${String(count + 1).padStart(5, '0')}`;

     let purity: number | undefined;
     if (brix != null && pol != null) {
       purity = Number(brix) > 0 ? (Number(pol) / Number(brix)) * 100 : 0;
     }

     const ticket = await prisma.weightTicket.create({
       data: {
         ticketNo,
         bagonId,
         farmId,
         grossWeight: Number(grossWeight),
         tareWeight: Number(tareWeight),
         netWeight,
         brix: brix != null ? Number(brix) : undefined,
         pol: pol != null ? Number(pol) : undefined,
         purity: purity != null ? Math.round(purity * 100) / 100 : undefined,
         sampleCollected: sampleCollected === true,
         status: 'PENDING',
         notes,
         farmerId: req.user!.userId
       },
       include: { farm: true, bagon: true }
     });

     res.status(201).json(ticket);
   } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.get('/tickets', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status, farmId } = req.query;
    let where: any = {};

    const farms = await prisma.farm.findMany({ where: { ownerId: req.user!.userId }});
    where.farmId = { in: farms.map(f => f.id) };

    if (status) where.status = status;
    if (farmId) where.farmId = farmId as string;

    const tickets = await prisma.weightTicket.findMany({
      where,
      include: {
        farm: true,
        farmer: { select: { name: true, assignedMill: true } },
        bagon: true,
        deliveryReceipts: true,
        payment: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ tickets });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.get('/tickets/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.weightTicket.findUnique({
      where: { id },
      include: {
        farm: { include: { owner: { select: { name: true, email: true, contactNumber: true, address: true, assignedMill: true } } } },
        farmer: { select: { name: true, email: true, contactNumber: true } },
        bagon: true,
        deliveryReceipts: true,
        payment: true
      }
    });
    if (!ticket) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }

    const farms = await prisma.farm.findMany({ where: { ownerId: req.user!.userId }, select: { id: true } });
    const farmIds = farms.map(f => f.id);
    if (!farmIds.includes(ticket.farmId)) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const timeline = [];
    timeline.push({
      type: 'CREATED',
      date: ticket.createdAt,
      label: 'Ticket Created',
      description: `Ticket ${ticket.ticketNo} was created`
    });

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

apiRouter.patch('/tickets/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticket = await prisma.weightTicket.findUnique({ where: { id: req.params.id } });
    if (!ticket) { res.status(404).json({ message: 'Ticket not found' }); return; }

    const farms = await prisma.farm.findMany({ where: { ownerId: req.user!.userId }, select: { id: true } });
    const farmIds = farms.map(f => f.id);
    if (!farmIds.includes(ticket.farmId)) { res.status(403).json({ message: 'Access denied' }); return; }
    if (ticket.status !== 'PENDING') {
      res.status(400).json({ message: 'Can only edit PENDING tickets' }); return;
    }

    const { bagonId, grossWeight, tareWeight, brix, pol, sampleCollected, notes, status } = req.body;
    const updateData: any = {};
    if (bagonId) updateData.bagonId = bagonId;
    if (grossWeight != null) updateData.grossWeight = Number(grossWeight);
    if (tareWeight != null) updateData.tareWeight = Number(tareWeight);
    if (grossWeight != null && tareWeight != null) {
      updateData.netWeight = Number(grossWeight) - Number(tareWeight);
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
    if (status && ['PENDING', 'PAID'].includes(status)) updateData.status = status;

    const updated = await prisma.weightTicket.update({
      where: { id: req.params.id }, data: updateData,
      include: { farm: true, bagon: true }
    });
    res.json(updated);
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

// --- FARMS ROUTES ---
apiRouter.get('/farms', authMiddleware, async (req: AuthRequest, res: Response) => {
   try {
     const farms = await prisma.farm.findMany({
       where: { isArchived: false },
       include: {         owner: { select: { name: true, assignedMill: true } } }
     });
     res.json({ farms });
   } catch(e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.get('/farms/mine', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const farms = await prisma.farm.findMany({
      where: { ownerId: req.user!.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ farms });
  } catch(e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.post('/farms', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
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
    res.status(201).json(farm);
  } catch(e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.patch('/farms/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
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
    res.json(updated);
  } catch(e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.patch('/farms/:id/archive', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
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
    res.json(updated);
  } catch(e: any) { res.status(500).json({ message: e.message }); }
});

// --- PASSWORD CHANGE ---
apiRouter.patch('/users/:id/password', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
     const { id } = req.params;
     if (id !== req.user!.userId) {
       res.status(403).json({ message: 'Access denied' });
       return;
     }
     const { password } = req.body;
     const passwordHash = await bcrypt.hash(password, 10);
      await prisma.user.update({ where: { id }, data: { passwordHash } });
      res.json({ message: 'Password updated successfully' });
   } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// --- SUMMARY STATS ---
apiRouter.get('/summary', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const farms = await prisma.farm.findMany({ where: { ownerId: req.user!.userId } });
    const whereClause = { farmId: { in: farms.map(f => f.id) } };

    const total = await prisma.weightTicket.count({ where: whereClause });
    const paid = await prisma.weightTicket.count({ where: { ...whereClause, status: 'PAID' } });
    const pending = await prisma.weightTicket.count({ where: { ...whereClause, status: 'PENDING' } });
    const weightAgg = await prisma.weightTicket.aggregate({
      where: whereClause,
      _sum: { netWeight: true }
    });

    res.json({
      totalTickets: total,
      paid,
      pending,
      totalWeight: weightAgg._sum.netWeight || 0
    });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});
