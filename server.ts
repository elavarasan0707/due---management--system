import express from 'express';
import path from 'path';
import fs from 'fs';
import { db } from './server/db';
import { createToken, revokeToken, getUserByToken, authenticate, requireRole, AuthenticatedRequest } from './server/auth';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Public Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // --- AUTHENTICATION ---
  // Login with Username (Roll No / Staff ID / Email) and Password
  app.post('/api/auth/login', (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const user = db.findUserByCredentials(username, password);
      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials. Only registered personnel and students can log in.'
        });
      }

      const token = createToken(user);
      res.json({
        token,
        user
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Login failed' });
    }
  });

  // Check Current Session
  app.get('/api/auth/me', authenticate, (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
  });

  // Change Password
  app.post('/api/auth/change-password', authenticate, (req: AuthenticatedRequest, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }

      db.changeUserPassword(req.user!.id, oldPassword, newPassword);
      res.json({ success: true, message: 'Password updated successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Logout
  app.post('/api/auth/logout', authenticate, (req: AuthenticatedRequest, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      revokeToken(token);
    }
    res.json({ success: true });
  });

  // --- STATS & OVERVIEW ---
  app.get('/api/stats', authenticate, (req: AuthenticatedRequest, res) => {
    try {
      const stats = db.getStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- DEPARTMENTS ---
  app.get('/api/departments', (req, res) => {
    res.json(db.getDepartments());
  });

  app.post('/api/departments', authenticate, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      const { code, name, description } = req.body;
      if (!code || !name) {
        return res.status(400).json({ error: 'Code and Name are required' });
      }
      const dept = db.addDepartment(code, name, description || '', req.user!);
      res.status(201).json(dept);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ADMIN: Update Department (Edit & Save)
  app.put('/api/departments/:id', authenticate, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      const { code, name, description, hodId } = req.body;
      const dept = db.updateDepartment(req.params.id, { code, name, description, hodId }, req.user!);
      res.json(dept);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ADMIN: Delete Department
  app.delete('/api/departments/:id', authenticate, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      const success = db.deleteDepartment(req.params.id, req.user!);
      res.json({ success });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- USERS MANAGEMENT ---
  // Filterable by role and department
  app.get('/api/users', authenticate, (req: AuthenticatedRequest, res) => {
    try {
      const role = req.query.role as string | undefined;
      const deptId = req.query.departmentId as string | undefined;

      // Restrict HOD to seeing only their department
      if (req.user!.role === 'HOD') {
        const users = db.getAllUsers(role, req.user!.departmentId);
        return res.json(users);
      }

      // Restrict Staff to seeing only students in their department (or central)
      if (req.user!.role === 'STAFF') {
        const users = db.getAllUsers('STUDENT', req.user!.departmentId);
        return res.json(users);
      }

      // Admin can see everything
      const users = db.getAllUsers(role, deptId);
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ADMIN: Register new HOD
  app.post('/api/admin/hod', authenticate, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      const { name, username, email, password, departmentId, phone } = req.body;
      if (!name || !username || !email || !departmentId) {
        return res.status(400).json({ error: 'Name, username, email and department are required' });
      }

      const hod = db.addHod(
        { name, username, email, password, departmentId, phone },
        req.user!
      );
      res.status(201).json(hod);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ADMIN: Register new Student
  app.post('/api/admin/student', authenticate, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      const { name, rollNo, registerNo, email, password, departmentId, degree, batchYear, semester, isHosteler, phone } = req.body;
      if (!name || !rollNo || !email || !departmentId) {
        return res.status(400).json({ error: 'Name, Roll Number, Email, and Department are required' });
      }

      const student = db.addStudent(
        { name, rollNo, registerNo, email, password, departmentId, degree, batchYear, semester, isHosteler, phone },
        req.user!
      );
      res.status(201).json(student);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ADMIN: Bulk Register Students
  app.post('/api/admin/student/bulk', authenticate, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      const { students } = req.body;
      if (!Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ error: 'Invalid students list provided' });
      }

      const created: any[] = [];
      const errors: any[] = [];

      for (const s of students) {
        try {
          const student = db.addStudent(s, req.user!);
          created.push(student);
        } catch (e: any) {
          errors.push({ rollNo: s.rollNo, error: e.message });
        }
      }

      res.status(201).json({ createdCount: created.length, created, errors });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // HOD (or Admin): Allocate Staff Member for their department or Central Office
  app.post('/api/hod/staff', authenticate, requireRole('HOD', 'ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      const { name, staffId, email, password, designation, clearanceScope, departmentId, phone } = req.body;
      if (!name || !staffId || !email || !designation || !clearanceScope) {
        return res.status(400).json({ error: 'Staff ID, Name, Email, Designation and Clearance Scope are required' });
      }

      const staff = db.addStaff(
        { name, staffId, email, password, designation, clearanceScope, departmentId, phone },
        req.user!
      );
      res.status(201).json(staff);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // UPDATE USER (Admin or HOD for own staff)
  app.put('/api/users/:id', authenticate, requireRole('ADMIN', 'HOD'), (req: AuthenticatedRequest, res) => {
    try {
      const updated = db.updateUser(req.params.id, req.body, req.user!);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // DELETE USER (Admin or HOD for own staff)
  app.delete('/api/users/:id', authenticate, requireRole('ADMIN', 'HOD'), (req: AuthenticatedRequest, res) => {
    try {
      const success = db.deleteUser(req.params.id, req.user!);
      if (!success) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- SUBJECTS & FACULTY ALLOCATION ---
  // List subjects (can filter by departmentId, staffId, semester)
  app.get('/api/subjects', authenticate, (req: AuthenticatedRequest, res) => {
    try {
      const deptId = (req.query.departmentId as string) || undefined;
      const staffId = (req.query.staffId as string) || undefined;
      const semester = req.query.semester ? parseInt(req.query.semester as string, 10) : undefined;

      const subjects = db.getSubjects(deptId, staffId, semester);
      res.json(subjects);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get single subject
  app.get('/api/subjects/:id', authenticate, (req: AuthenticatedRequest, res) => {
    try {
      const subject = db.getSubjectById(req.params.id);
      if (!subject) {
        return res.status(404).json({ error: 'Subject not found' });
      }
      res.json(subject);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create subject & allocate faculty (Admin or HOD)
  app.post('/api/subjects', authenticate, requireRole('ADMIN', 'HOD'), (req: AuthenticatedRequest, res) => {
    try {
      const { code, name, departmentId, semester, type, credits, assignedStaffId, batchYear, description } = req.body;
      if (!code || !name || !departmentId || !semester) {
        return res.status(400).json({ error: 'Subject Code, Name, Department, and Semester are required.' });
      }

      // If HOD, ensure they are adding within their own department unless Admin
      if (req.user!.role === 'HOD' && req.user!.departmentId && departmentId !== req.user!.departmentId) {
        return res.status(403).json({ error: 'HODs can only create subjects in their assigned department.' });
      }

      const subject = db.createSubject(
        {
          code,
          name,
          departmentId,
          semester: Number(semester),
          type: type || 'THEORY',
          credits: credits ? Number(credits) : 3,
          assignedStaffId: assignedStaffId || undefined,
          batchYear,
          description,
        },
        req.user!
      );

      res.status(201).json(subject);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Update subject details or allocation (Admin or HOD)
  app.put('/api/subjects/:id', authenticate, requireRole('ADMIN', 'HOD'), (req: AuthenticatedRequest, res) => {
    try {
      const existing = db.getSubjectById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Subject not found' });
      }

      // HOD scope check
      if (req.user!.role === 'HOD' && req.user!.departmentId && existing.departmentId !== req.user!.departmentId) {
        return res.status(403).json({ error: 'HODs can only modify subjects in their assigned department.' });
      }

      const updated = db.updateSubject(req.params.id, req.body, req.user!);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Quick Faculty Allocation endpoint
  app.post('/api/subjects/:id/allocate', authenticate, requireRole('ADMIN', 'HOD'), (req: AuthenticatedRequest, res) => {
    try {
      const { staffId } = req.body; // Can be empty string to deallocate
      const existing = db.getSubjectById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Subject not found' });
      }

      if (req.user!.role === 'HOD' && req.user!.departmentId && existing.departmentId !== req.user!.departmentId) {
        return res.status(403).json({ error: 'HODs can only allocate subjects in their assigned department.' });
      }

      const updated = db.allocateSubjectStaff(req.params.id, staffId || '', req.user!);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Delete subject (Admin or HOD)
  app.delete('/api/subjects/:id', authenticate, requireRole('ADMIN', 'HOD'), (req: AuthenticatedRequest, res) => {
    try {
      const existing = db.getSubjectById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Subject not found' });
      }

      if (req.user!.role === 'HOD' && req.user!.departmentId && existing.departmentId !== req.user!.departmentId) {
        return res.status(403).json({ error: 'HODs can only delete subjects in their assigned department.' });
      }

      db.deleteSubject(req.params.id, req.user!);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- CLEARANCES ---
  // List clearances (filtered by department or user role)
  app.get('/api/clearances', authenticate, (req: AuthenticatedRequest, res) => {
    try {
      const deptId = req.query.departmentId as string | undefined;

      if (req.user!.role === 'STUDENT') {
        const clearance = db.getClearanceByStudentId(req.user!.id);
        return res.json(clearance ? [clearance] : []);
      }

      if (req.user!.role === 'HOD') {
        const clearances = db.getClearances(req.user!.departmentId);
        return res.json(clearances);
      }

      // STAFF
      if (req.user!.role === 'STAFF') {
        const clearances = db.getClearancesForStaff(req.user!);
        return res.json(clearances);
      }

      const clearances = db.getClearances(deptId);
      res.json(clearances);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Student's own clearance
  app.get('/api/clearances/my', authenticate, requireRole('STUDENT'), (req: AuthenticatedRequest, res) => {
    try {
      const clearance = db.getClearanceByStudentId(req.user!.id);
      if (!clearance) {
        return res.status(404).json({ error: 'No clearance record found for your account' });
      }
      res.json(clearance);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Approver Action: Approve, Raise Due, Clear Due, Reject
  app.post('/api/clearances/action', authenticate, requireRole('STAFF', 'HOD', 'ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      const { studentClearanceId, itemId, action, dueAmount, dueReason, remarks } = req.body;
      if (!studentClearanceId || !itemId || !action) {
        return res.status(400).json({ error: 'Missing required clearance action parameters' });
      }

      const updated = db.updateClearanceAction({
        studentClearanceId,
        itemId,
        action,
        dueAmount: Number(dueAmount || 0),
        dueReason,
        remarks,
        actor: req.user!
      });

      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Checkpoint Direct Edit & Save (Admin, HOD, Staff)
  app.put('/api/clearances/:clearanceId/items/:itemId', authenticate, requireRole('ADMIN', 'HOD', 'STAFF'), (req: AuthenticatedRequest, res) => {
    try {
      const { title, status, dueAmount, dueReason, remarks } = req.body;
      const updated = db.updateClearanceItem({
        studentClearanceId: req.params.clearanceId,
        itemId: req.params.itemId,
        title,
        status,
        dueAmount,
        dueReason,
        remarks,
        actor: req.user!,
      });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Add Custom Clearance Checkpoint (Admin or HOD)
  app.post('/api/clearances/:clearanceId/items', authenticate, requireRole('ADMIN', 'HOD'), (req: AuthenticatedRequest, res) => {
    try {
      const { title, category, assignedScope, dueAmount, dueReason, remarks } = req.body;
      if (!title) return res.status(400).json({ error: 'Checkpoint title is required' });
      const updated = db.addClearanceCheckpoint(req.params.clearanceId, {
        title,
        category,
        assignedScope,
        dueAmount,
        dueReason,
        remarks
      }, req.user!);
      res.status(201).json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Delete Clearance Checkpoint (Admin only)
  app.delete('/api/clearances/:clearanceId/items/:itemId', authenticate, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      const updated = db.deleteClearanceCheckpoint(req.params.clearanceId, req.params.itemId, req.user!);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Student Pays / Settles Due Online
  app.post('/api/clearances/pay-due', authenticate, requireRole('STUDENT', 'ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      const { studentClearanceId, itemId, transactionNote } = req.body;
      if (!studentClearanceId || !itemId) {
        return res.status(400).json({ error: 'Clearance and Checkpoint IDs are required' });
      }

      const updated = db.payDue(studentClearanceId, itemId, req.user!, transactionNote);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Certificate Verification (public check using certificate ID / hash)
  app.get('/api/certificate/verify/:certId', (req, res) => {
    try {
      const clearances = db.getClearances();
      const found = clearances.find(c => c.certificateId === req.params.certId || c.verificationHash === req.params.certId);
      if (!found || found.overallStatus !== 'COMPLETED') {
        return res.status(404).json({ valid: false, error: 'Certificate not found or not verified' });
      }
      res.json({
        valid: true,
        certificateId: found.certificateId,
        studentName: found.studentName,
        rollNo: found.studentRollNo,
        registerNo: found.studentRegisterNo,
        department: found.studentDepartmentName,
        issuedAt: found.certificateIssuedAt,
        verificationHash: found.verificationHash
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // System Reset (Reset dues, restore institutional state, or wipe)
  app.post('/api/system/reset', (req, res) => {
    try {
      const { mode, confirmReset } = req.body; // 'demo' | 'clear_dues' | 'wipe' | 'clean_init'

      // Check admin authentication if provided, or allow if confirmReset is true
      const authHeader = req.headers.authorization;
      let hasAdminPerms = false;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const user = getUserByToken(token);
        if (user && user.role === 'ADMIN') {
          hasAdminPerms = true;
        }
      }

      if (!hasAdminPerms && !confirmReset) {
        return res.status(401).json({ error: 'Administrative authorization or confirmReset flag required.' });
      }

      const resetMode = mode || 'demo';
      if (!['demo', 'clear_dues', 'wipe', 'clean_init'].includes(resetMode)) {
        return res.status(400).json({ error: 'Valid mode required: demo, clear_dues, wipe, or clean_init' });
      }

      const result = db.resetSystem(resetMode as any);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ADMIN: Audit Logs
  app.get('/api/audit-logs', authenticate, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      res.json(db.getAuditLogs(100));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 404 handler for API routes so it NEVER returns HTML to API callers
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
  });

  // --- VITE / STATIC MIDDLEWARE ---
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));

  if (process.env.NODE_ENV === 'production' || hasDist) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`No-Due College Management Server running on port ${PORT}`);
  });
}

startServer();
