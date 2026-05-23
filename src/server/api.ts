import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
export const apiRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_fallback_secret_minimum_32_chars';
const THRESHOLD = Number(process.env.DISCREPANCY_THRESHOLD) || 50;

// --- TYPES ---
export interface AuthRequest extends Request {
  user?: { userId: string; role: string; name: string };
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
    // Clients registering publicly are always FARMER
    const role = 'FARMER';

    // Validation
    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email, and password are required' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ message: 'Email already in use' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role, contactNumber, address },
      select: { id: true, name: true, email: true, role: true, contactNumber: true, address: true, profilePicture: true }
    });
    // Auto-create their first farm configuration
    await prisma.farm.create({
      data: {
        farmName: farmName || `${name}'s Farm`,
        location: farmLocation || 'Local Region',
        barangay: 'Unspecified',
        hectares: 5,
        ownerId: user.id
      }
    });

    res.status(201).json({ message: 'Account created successfully. Please sign in.', user });
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
    res.json({ token, user: { id: user.id, userId: user.id, name: user.name, email: user.email, role: user.role, contactNumber: user.contactNumber, address: user.address, profilePicture: user.profilePicture } });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

apiRouter.get('/auth/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
     const user = await prisma.user.findUnique({
       where: { id: req.user!.userId },
       include: { farms: { select: { id: true, farmName: true, location: true, barangay: true, hectares: true } } }
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
      include: { farms: { select: { id: true, farmName: true, location: true, barangay: true, hectares: true } } }
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
     res.status(201).json({ message: 'Staff user created successfully', user });
   } catch (e: any) { res.status(500).json({ message: e.message }); }
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
         type: 'TICKET_CREATED',
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
         // We might optionally adjust totalValue here based on refinery weight
      },
      include: { farm: true }
    });

    await prisma.notification.create({
      data: {
        userId: updatedTicket.farm.ownerId,
        type: flagged ? 'TICKET_DISPUTED' : 'TICKET_RECONCILED',
        message: flagged 
           ? `Variance flagged on ticket ${updatedTicket.ticketNo}. Awaiting resolution.`
           : `Ticket ${updatedTicket.ticketNo} reconciled successfully.`
      }
    });

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
    
    await prisma.weightTicket.update({
      where: { id: record.ticketId },
      data: { status: 'RECONCILED' } // Set back to reconciled once verified
    });
    
    await writeAuditLog(req.user!.userId, 'RESOLVE_DISPUTE', record.id, 'ReconciliationRecord');
    res.json({ message: 'Dispute resolved', record });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// --- FARMS & USERS ---
apiRouter.get('/farms', authMiddleware, async (req: AuthRequest, res: Response) => {
   try {
     const farms = await prisma.farm.findMany({ include: { owner: { select: { name: true } } } });
     res.json({ farms });
   } catch(e: any) { res.status(500).json({ message: e.message }); }
});

apiRouter.get('/users', authMiddleware, roleGuard(['ADMIN']), async (req: AuthRequest, res: Response) => {
   try {
     const users = await prisma.user.findMany({
       select: { id: true, name: true, email: true, role: true, isActive: true, contactNumber: true, address: true, createdAt: true },
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

apiRouter.get('/notifications', authMiddleware, async (req: AuthRequest, res: Response) => {
   try {
     const notifications = await prisma.notification.findMany({
       where: { userId: req.user!.userId },
       orderBy: { createdAt: 'desc' },
       take: 10
     });
     res.json({ notifications });
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
