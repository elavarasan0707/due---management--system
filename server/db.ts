import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Department, User, StudentClearanceRecord, ClearanceItem, SystemStats, ClearanceStatus, Subject } from '../src/types';

interface DatabaseSchema {
  departments: Department[];
  users: User[];
  clearances: StudentClearanceRecord[];
  subjects: Subject[];
  auditLogs: Array<{
    id: string;
    action: string;
    performedBy: string;
    performedByRole: string;
    details: string;
    timestamp: string;
  }>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

function getDefaultCheckpoints(student: Partial<User>, deptName: string): ClearanceItem[] {
  const items: ClearanceItem[] = [
    {
      id: generateId('item'),
      checkpointKey: 'dept_advisor',
      title: 'Class Advisor / Tutor Clearance',
      category: 'DEPARTMENT',
      departmentId: student.departmentId,
      departmentName: deptName,
      status: 'PENDING',
      dueAmount: 0,
      assignedRole: 'STAFF',
      assignedScope: 'Class Advisor',
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateId('item'),
      checkpointKey: 'dept_lab',
      title: `${deptName} Laboratories & Equipment`,
      category: 'DEPARTMENT',
      departmentId: student.departmentId,
      departmentName: deptName,
      status: 'PENDING',
      dueAmount: 0,
      assignedRole: 'STAFF',
      assignedScope: `${deptName} Labs & Equipment`,
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateId('item'),
      checkpointKey: 'dept_library',
      title: `${deptName} Department Library & Seminar Records`,
      category: 'DEPARTMENT',
      departmentId: student.departmentId,
      departmentName: deptName,
      status: 'PENDING',
      dueAmount: 0,
      assignedRole: 'STAFF',
      assignedScope: `${deptName} Dept Library`,
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateId('item'),
      checkpointKey: 'dept_hod',
      title: `HOD Final Department Endorsement (${deptName})`,
      category: 'DEPARTMENT',
      departmentId: student.departmentId,
      departmentName: deptName,
      status: 'PENDING',
      dueAmount: 0,
      assignedRole: 'HOD',
      assignedScope: 'HOD Department Signoff',
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateId('item'),
      checkpointKey: 'central_library',
      title: 'Central College Library Clearance',
      category: 'CENTRAL',
      status: 'PENDING',
      dueAmount: 0,
      assignedRole: 'STAFF',
      assignedScope: 'Central Library',
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateId('item'),
      checkpointKey: 'accounts',
      title: 'College Finance & Accounts Counter (Tuition & Exam Fees)',
      category: 'CENTRAL',
      status: 'PENDING',
      dueAmount: 0,
      assignedRole: 'STAFF',
      assignedScope: 'Accounts Section',
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateId('item'),
      checkpointKey: 'sports',
      title: 'Physical Education & Sports Directorate',
      category: 'CENTRAL',
      status: 'PENDING',
      dueAmount: 0,
      assignedRole: 'STAFF',
      assignedScope: 'Sports Directorate',
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateId('item'),
      checkpointKey: 'placement',
      title: 'Career Guidance & Training & Placement Cell',
      category: 'CENTRAL',
      status: 'PENDING',
      dueAmount: 0,
      assignedRole: 'STAFF',
      assignedScope: 'Placement Cell',
      updatedAt: new Date().toISOString(),
    }
  ];

  if (student.isHosteler) {
    items.push({
      id: generateId('item'),
      checkpointKey: 'hostel',
      title: 'College Hostel & Mess Directorate Clearance',
      category: 'CENTRAL',
      status: 'PENDING',
      dueAmount: 0,
      assignedRole: 'STAFF',
      assignedScope: 'Hostel Office',
      updatedAt: new Date().toISOString(),
    });
  }

  return items;
}

export function createInitialSeedData(): DatabaseSchema {
  const departments: Department[] = [
    {
      id: 'dept_cse',
      code: 'CSE',
      name: 'Computer Science and Engineering',
      description: 'Department of Computer Science & Engineering',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'dept_ece',
      code: 'ECE',
      name: 'Electronics and Communication Engineering',
      description: 'Department of Electronics & Communication Engineering',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'dept_eee',
      code: 'EEE',
      name: 'Electrical and Electronics Engineering',
      description: 'Department of Electrical & Electronics Engineering',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'dept_mech',
      code: 'MECH',
      name: 'Mechanical Engineering',
      description: 'Department of Mechanical Engineering',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'dept_it',
      code: 'IT',
      name: 'Information Technology',
      description: 'Department of Information Technology',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'dept_civil',
      code: 'CIVIL',
      name: 'Civil Engineering',
      description: 'Department of Civil Engineering',
      createdAt: new Date().toISOString(),
    },
  ];

  const users: User[] = [
    // 1. MASTER ADMINISTRATOR (Full Control)
    {
      id: 'user_admin',
      username: 'admin',
      name: 'College Administrator',
      email: 'admin@college.edu',
      password: 'admin123',
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    },
  ];

  // Clean state: No demo clearances
  const clearances: StudentClearanceRecord[] = [];

  const subjects: Subject[] = [
    {
      id: 'subj_cs8651',
      code: 'CS8651',
      name: 'Internet Programming',
      departmentId: 'dept_cse',
      departmentCode: 'CSE',
      departmentName: 'Computer Science and Engineering',
      semester: 6,
      type: 'THEORY',
      credits: 3,
      batchYear: '2021 - 2025',
      description: 'Web development, server protocols, full-stack architecture, and APIs',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'subj_cs8661',
      code: 'CS8661',
      name: 'Internet Programming Laboratory',
      departmentId: 'dept_cse',
      departmentCode: 'CSE',
      departmentName: 'Computer Science and Engineering',
      semester: 6,
      type: 'PRACTICAL',
      credits: 2,
      batchYear: '2021 - 2025',
      description: 'Practical lab experiments in web technologies, client-server apps, and databases',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'subj_cs8691',
      code: 'CS8691',
      name: 'Artificial Intelligence & Machine Learning',
      departmentId: 'dept_cse',
      departmentCode: 'CSE',
      departmentName: 'Computer Science and Engineering',
      semester: 7,
      type: 'THEORY',
      credits: 4,
      batchYear: '2021 - 2025',
      description: 'Search algorithms, supervised learning, deep networks, and neural models',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'subj_ec8395',
      code: 'EC8395',
      name: 'Communication Engineering',
      departmentId: 'dept_ece',
      departmentCode: 'ECE',
      departmentName: 'Electronics and Communication Engineering',
      semester: 5,
      type: 'THEORY',
      credits: 3,
      batchYear: '2021 - 2025',
      description: 'Analog and digital transmission systems, modulation, and signal propagation',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'subj_me8594',
      code: 'ME8594',
      name: 'Applied Hydraulics & Pneumatics',
      departmentId: 'dept_mech',
      departmentCode: 'MECH',
      departmentName: 'Mechanical Engineering',
      semester: 5,
      type: 'THEORY',
      credits: 3,
      batchYear: '2021 - 2025',
      description: 'Fluid power fundamentals, hydraulic circuits, valves, and industrial actuators',
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    departments,
    users,
    clearances,
    subjects,
    auditLogs: [
      {
        id: generateId('log'),
        action: 'SYSTEM_INITIALIZED',
        performedBy: 'admin',
        performedByRole: 'ADMIN',
        details: 'Institutional No Due System initialized for live college usage. Ready for Administrator and HOD allocations.',
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
    this.syncSubjectCheckpoints();
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.clearances && parsed.departments) {
          parsed.subjects = parsed.subjects || [];
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse existing db.json, generating fresh seed.', e);
    }

    const seed = createInitialSeedData();
    this.saveData(seed);
    return seed;
  }

  private saveData(dataToSave?: DatabaseSchema) {
    try {
      const data = dataToSave || this.data;
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving db.json:', e);
    }
  }

  public resetSystem(mode: 'clean_init' | 'demo' | 'clear_dues' | 'wipe') {
    if (mode === 'clean_init' || mode === 'demo') {
      this.data = createInitialSeedData();
      this.saveData();
      return { success: true, message: 'System reset to clean institutional state with Administrator and standard departments.' };
    }

    if (mode === 'clear_dues') {
      // Clear all raised dues and reset student checkpoints to PENDING
      this.data.clearances.forEach(clr => {
        clr.clearedCheckpoints = 0;
        clr.totalDueAmount = 0;
        clr.overallStatus = 'IN_PROGRESS';
        clr.certificateId = undefined;
        clr.certificateIssuedAt = undefined;
        clr.verificationHash = undefined;
        clr.items.forEach(item => {
          item.status = 'PENDING';
          item.dueAmount = 0;
          item.dueReason = undefined;
          item.remarks = undefined;
          item.studentProof = undefined;
          item.clearedByUserId = undefined;
          item.clearedByUserName = undefined;
          item.clearedByDesignation = undefined;
          item.clearedAt = undefined;
        });
      });
      this.saveData();
      return { success: true, message: 'All dues and clearance checkpoints reset to fresh Pending state.' };
    }

    if (mode === 'wipe') {
      // Keep only master admin
      const adminUser = this.data.users.find(u => u.role === 'ADMIN') || {
        id: 'user_admin',
        username: 'admin',
        name: 'College Administrator',
        email: 'admin@college.edu',
        password: 'admin123',
        role: 'ADMIN' as const,
        status: 'ACTIVE' as const,
        createdAt: new Date().toISOString(),
      };

      const defaultDepts: Department[] = [
        { id: 'dept_cse', code: 'CSE', name: 'Computer Science and Engineering', description: 'Department of Computer Science & Engineering', createdAt: new Date().toISOString() },
        { id: 'dept_ece', code: 'ECE', name: 'Electronics and Communication Engineering', description: 'Department of Electronics & Communication Engineering', createdAt: new Date().toISOString() },
        { id: 'dept_eee', code: 'EEE', name: 'Electrical and Electronics Engineering', description: 'Department of Electrical & Electronics Engineering', createdAt: new Date().toISOString() },
        { id: 'dept_mech', code: 'MECH', name: 'Mechanical Engineering', description: 'Department of Mechanical Engineering', createdAt: new Date().toISOString() },
        { id: 'dept_it', code: 'IT', name: 'Information Technology', description: 'Department of Information Technology', createdAt: new Date().toISOString() },
        { id: 'dept_civil', code: 'CIVIL', name: 'Civil Engineering', description: 'Department of Civil Engineering', createdAt: new Date().toISOString() },
      ];

      this.data = {
        departments: defaultDepts,
        users: [adminUser],
        clearances: [],
        subjects: [],
        auditLogs: [
          {
            id: generateId('log'),
            action: 'SYSTEM_WIPED',
            performedBy: adminUser.username,
            performedByRole: 'ADMIN',
            details: 'System wiped by Administrator. Ready for fresh records.',
            timestamp: new Date().toISOString(),
          }
        ]
      };
      this.saveData();
      return { success: true, message: 'System wiped. Only master Admin remains active.' };
    }

    return { success: false, message: 'Unknown reset mode.' };
  }

  // Auth & Users
  public findUserByCredentials(usernameOrEmail: string, passwordAttempt: string): User | null {
    const cleanIdentifier = (usernameOrEmail || '').trim().toLowerCase();
    const cleanPassword = (passwordAttempt || '').trim();

    const user = this.data.users.find(u => {
      if (u.status && u.status !== 'ACTIVE') return false;
      const uName = (u.username || '').trim().toLowerCase();
      const uEmail = (u.email || '').trim().toLowerCase();
      const uRoll = (u.rollNo || '').trim().toLowerCase();
      const uReg = (u.registerNo || '').trim().toLowerCase();
      const uStaff = (u.staffId || '').trim().toLowerCase();

      return (
        uName === cleanIdentifier ||
        uEmail === cleanIdentifier ||
        uRoll === cleanIdentifier ||
        uReg === cleanIdentifier ||
        uStaff === cleanIdentifier
      );
    });

    if (!user) return null;

    const storedPassword = (user.password || '').trim();
    if (user.password === passwordAttempt || storedPassword === cleanPassword) {
      // Don't leak raw password in response
      const { password, ...safeUser } = user;
      return safeUser as User;
    }
    return null;
  }

  public findUserById(id: string): User | null {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser as User;
  }

  public getAllUsers(filterRole?: string, departmentId?: string): User[] {
    return this.data.users
      .filter(u => {
        if (filterRole && u.role !== filterRole) return false;
        if (departmentId && u.departmentId !== departmentId) return false;
        return true;
      })
      .map(u => {
        // Return without password for safety
        const { password, ...safeUser } = u;
        return {
          ...safeUser,
          // Expose password ONLY for demo/admin ease of management if requested
          password: u.password
        } as User;
      });
  }

  // Admin Adds HOD
  public addHod(data: {
    name: string;
    username: string;
    email: string;
    password?: string;
    departmentId: string;
    phone?: string;
  }, adminUser: User): User {
    const dept = this.ensureDepartment(data.departmentId, adminUser);

    // Check username/email uniqueness
    const exists = this.data.users.some(u =>
      u.username.toLowerCase() === data.username.trim().toLowerCase() ||
      u.email.toLowerCase() === data.email.trim().toLowerCase()
    );
    if (exists) throw new Error('Username or Email already registered');

    const newHod: User = {
      id: generateId('user_hod'),
      username: data.username.trim(),
      name: data.name.trim(),
      email: data.email.trim(),
      password: data.password || 'hod123',
      role: 'HOD',
      departmentId: dept.id,
      departmentName: dept.name,
      phone: data.phone,
      status: 'ACTIVE',
      allocatedBy: adminUser.id,
      allocatedByName: adminUser.name,
      createdAt: new Date().toISOString(),
    };

    this.data.users.push(newHod);

    // Update department reference
    dept.hodId = newHod.id;
    dept.hodName = newHod.name;
    dept.hodEmail = newHod.email;

    this.logAction('CREATE_HOD', adminUser.username, 'ADMIN', `Created HOD ${newHod.name} for ${dept.name}`);
    this.saveData();
    return newHod;
  }

  // Admin Adds Student
  public addStudent(data: {
    name: string;
    rollNo: string;
    registerNo?: string;
    email: string;
    password?: string;
    departmentId: string;
    degree?: string;
    batchYear?: string;
    semester?: number;
    isHosteler?: boolean;
    phone?: string;
  }, adminUser: User): User {
    const dept = this.ensureDepartment(data.departmentId, adminUser);

    const cleanRollNo = data.rollNo.trim().toUpperCase();
    const cleanUsername = cleanRollNo;

    const exists = this.data.users.some(u =>
      u.username.toLowerCase() === cleanUsername.toLowerCase() ||
      (u.rollNo && u.rollNo.toUpperCase() === cleanRollNo) ||
      u.email.toLowerCase() === data.email.trim().toLowerCase()
    );
    if (exists) throw new Error(`Student with Roll No ${cleanRollNo} or Email already registered`);

    const newStudent: User = {
      id: generateId('user_stud'),
      username: cleanUsername,
      rollNo: cleanRollNo,
      registerNo: data.registerNo?.trim() || `REG-${cleanRollNo}`,
      name: data.name.trim(),
      email: data.email.trim(),
      password: data.password || 'student123',
      role: 'STUDENT',
      departmentId: dept.id,
      departmentName: dept.name,
      degree: data.degree || `B.E. ${dept.name}`,
      batchYear: data.batchYear || '2021 - 2025',
      semester: data.semester || 8,
      isHosteler: Boolean(data.isHosteler),
      phone: data.phone,
      status: 'ACTIVE',
      allocatedBy: adminUser.id,
      allocatedByName: adminUser.name,
      createdAt: new Date().toISOString(),
    };

    this.data.users.push(newStudent);

    // Create clearance record for this student
    const checkpoints = getDefaultCheckpoints(newStudent, dept.name);
    const clearanceRecord: StudentClearanceRecord = {
      id: generateId('clr'),
      studentId: newStudent.id,
      studentName: newStudent.name,
      studentRollNo: newStudent.rollNo!,
      studentRegisterNo: newStudent.registerNo!,
      studentDepartmentId: dept.id,
      studentDepartmentName: dept.name,
      degree: newStudent.degree!,
      batchYear: newStudent.batchYear!,
      semester: newStudent.semester!,
      isHosteler: Boolean(newStudent.isHosteler),
      totalCheckpoints: checkpoints.length,
      clearedCheckpoints: 0,
      totalDueAmount: 0,
      overallStatus: 'IN_PROGRESS',
      items: checkpoints,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.clearances.push(clearanceRecord);

    this.logAction('CREATE_STUDENT', adminUser.username, 'ADMIN', `Enrolled student ${newStudent.name} (${newStudent.rollNo})`);
    this.saveData();
    return newStudent;
  }

  // HOD or Admin Allocates Staff (HOD for their department, Admin for any department or Central Office)
  public addStaff(data: {
    name: string;
    staffId: string;
    email: string;
    password?: string;
    designation: string;
    clearanceScope: string;
    departmentId?: string;
    phone?: string;
  }, actorUser: User): User {
    if (actorUser.role !== 'HOD' && actorUser.role !== 'ADMIN') {
      throw new Error('Unauthorized: Only HOD or Administrator can allocate staff');
    }

    const deptId = actorUser.role === 'HOD'
      ? (actorUser.departmentId || this.data.departments[0]?.id)
      : data.departmentId;

    const dept = deptId ? this.ensureDepartment(deptId, actorUser) : undefined;

    const cleanStaffId = data.staffId.trim().toUpperCase();
    const cleanUsername = cleanStaffId.toLowerCase().replace(/[^a-z0-9]/g, '.');

    const exists = this.data.users.some(u =>
      u.username.toLowerCase() === cleanUsername ||
      (u.staffId && u.staffId.toUpperCase() === cleanStaffId) ||
      u.email.toLowerCase() === data.email.trim().toLowerCase()
    );
    if (exists) throw new Error(`Staff with ID ${cleanStaffId} or Email already registered`);

    const newStaff: User = {
      id: generateId('user_staff'),
      username: cleanUsername,
      staffId: cleanStaffId,
      name: data.name.trim(),
      email: data.email.trim(),
      password: data.password || 'staff123',
      role: 'STAFF',
      departmentId: dept?.id,
      departmentName: dept?.name || (data.clearanceScope.includes('Central') || data.clearanceScope.includes('Accounts') || data.clearanceScope.includes('Sports') || data.clearanceScope.includes('Placement') || data.clearanceScope.includes('Hostel') ? 'Central College Office' : undefined),
      designation: data.designation.trim(),
      clearanceScope: data.clearanceScope.trim(),
      phone: data.phone,
      status: 'ACTIVE',
      allocatedBy: actorUser.id,
      allocatedByName: actorUser.name,
      createdAt: new Date().toISOString(),
    };

    this.data.users.push(newStaff);
    this.logAction('ALLOCATE_STAFF', actorUser.username, actorUser.role, `Allocated staff ${newStaff.name} (${newStaff.staffId}) for ${newStaff.clearanceScope}`);
    this.saveData();
    return newStaff;
  }

  public addStaffByHod(data: {
    name: string;
    staffId: string;
    email: string;
    password?: string;
    designation: string;
    clearanceScope: string;
    phone?: string;
  }, hodUser: User): User {
    return this.addStaff(data, hodUser);
  }

  // Change Password
  public changeUserPassword(userId: string, oldPass: string, newPass: string): boolean {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) throw new Error('User account not found');
    if (user.password !== oldPass) throw new Error('Current password does not match');
    if (!newPass || newPass.trim().length < 4) throw new Error('New password must be at least 4 characters long');
    user.password = newPass.trim();
    this.logAction('CHANGE_PASSWORD', user.username, user.role, `Password changed successfully for ${user.username}`);
    this.saveData();
    return true;
  }

  // Update User (Admin or HOD for own staff)
  public updateUser(userId: string, data: Partial<User>, actor: User): User {
    const userIndex = this.data.users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User account not found');

    const targetUser = this.data.users[userIndex];

    // Permission check:
    // Admin can edit anyone.
    // HOD can only edit Staff in their department.
    if (actor.role === 'HOD') {
      if (targetUser.role !== 'STAFF' || targetUser.departmentId !== actor.departmentId) {
        throw new Error('HOD can only edit staff members in their assigned department');
      }
    } else if (actor.role !== 'ADMIN' && actor.id !== userId) {
      throw new Error('Unauthorized: insufficient permissions to update user');
    }

    // Update basic fields if provided
    if (data.name !== undefined && data.name.trim()) targetUser.name = data.name.trim();
    if (data.email !== undefined && data.email.trim()) targetUser.email = data.email.trim();
    if (data.phone !== undefined) targetUser.phone = data.phone.trim();
    if (data.status !== undefined) targetUser.status = data.status;
    if (data.password !== undefined && data.password.trim()) {
      targetUser.password = data.password.trim();
    }

    // Department change
    if (data.departmentId !== undefined && data.departmentId !== targetUser.departmentId) {
      const newDept = this.ensureDepartment(data.departmentId, actor);
      if (newDept) {
        targetUser.departmentId = newDept.id;
        targetUser.departmentName = newDept.name;
      }
    }

    // Student specific
    if (targetUser.role === 'STUDENT') {
      if (data.rollNo !== undefined && data.rollNo.trim()) {
        const cleanRollNo = data.rollNo.trim().toUpperCase();
        targetUser.rollNo = cleanRollNo;
        targetUser.username = cleanRollNo;
      }
      if (data.registerNo !== undefined && data.registerNo.trim()) {
        targetUser.registerNo = data.registerNo.trim();
      }
      if (data.degree !== undefined && data.degree.trim()) targetUser.degree = data.degree.trim();
      if (data.batchYear !== undefined && data.batchYear.trim()) targetUser.batchYear = data.batchYear.trim();
      if (data.semester !== undefined) targetUser.semester = Number(data.semester);
      if (data.isHosteler !== undefined) targetUser.isHosteler = Boolean(data.isHosteler);

      // Sync into clearance record
      const clr = this.data.clearances.find(c => c.studentId === targetUser.id);
      if (clr) {
        clr.studentName = targetUser.name;
        clr.studentRollNo = targetUser.rollNo || clr.studentRollNo;
        clr.studentRegisterNo = targetUser.registerNo || clr.studentRegisterNo;
        clr.studentDepartmentId = targetUser.departmentId || clr.studentDepartmentId;
        clr.studentDepartmentName = targetUser.departmentName || clr.studentDepartmentName;
        clr.degree = targetUser.degree || clr.degree;
        clr.batchYear = targetUser.batchYear || clr.batchYear;
        clr.semester = targetUser.semester || clr.semester;
        clr.isHosteler = Boolean(targetUser.isHosteler);
        clr.updatedAt = new Date().toISOString();
      }
    }

    // Staff specific
    if (targetUser.role === 'STAFF') {
      if (data.staffId !== undefined && data.staffId.trim()) {
        targetUser.staffId = data.staffId.trim().toUpperCase();
      }
      if (data.designation !== undefined && data.designation.trim()) {
        targetUser.designation = data.designation.trim();
      }
      if (data.clearanceScope !== undefined && data.clearanceScope.trim()) {
        targetUser.clearanceScope = data.clearanceScope.trim();
      }
    }

    // HOD specific
    if (targetUser.role === 'HOD') {
      if (data.username !== undefined && data.username.trim()) {
        targetUser.username = data.username.trim();
      }
      // Update department reference
      const dept = this.data.departments.find(d => d.id === targetUser.departmentId);
      if (dept) {
        dept.hodId = targetUser.id;
        dept.hodName = targetUser.name;
        dept.hodEmail = targetUser.email;
      }
    }

    this.logAction('UPDATE_USER', actor.username, actor.role, `Updated user ${targetUser.name} (${targetUser.role})`);
    this.saveData();

    return targetUser;
  }

  // Delete User
  public deleteUser(userId: string, requestingUser: User): boolean {
    const index = this.data.users.findIndex(u => u.id === userId);
    if (index === -1) return false;

    const targetUser = this.data.users[index];
    if (targetUser.role === 'ADMIN') {
      throw new Error('Master Administrator cannot be deleted');
    }

    // Permission check
    if (requestingUser.role === 'HOD') {
      // HOD can only delete staff allocated by them in their department
      if (targetUser.role !== 'STAFF' || targetUser.departmentId !== requestingUser.departmentId) {
        throw new Error('HOD can only remove staff members from their own department');
      }
    } else if (requestingUser.role !== 'ADMIN') {
      throw new Error('Unauthorized');
    }

    // Remove user
    this.data.users.splice(index, 1);

    // If student, remove clearance records
    if (targetUser.role === 'STUDENT') {
      this.data.clearances = this.data.clearances.filter(c => c.studentId !== userId);
    }

    // If HOD, clear department reference
    if (targetUser.role === 'HOD') {
      const dept = this.data.departments.find(d => d.hodId === userId || d.id === targetUser.departmentId);
      if (dept) {
        dept.hodId = undefined;
        dept.hodName = undefined;
        dept.hodEmail = undefined;
      }
    }

    this.logAction('DELETE_USER', requestingUser.username, requestingUser.role, `Deleted user ${targetUser.name} (${targetUser.role})`);
    this.saveData();
    return true;
  }

  // Departments
  public getDepartments(): Department[] {
    return this.data.departments;
  }

  public ensureDepartment(input: string, actor?: User): Department {
    if (!input || !input.trim()) {
      throw new Error('Department is required');
    }
    const clean = input.trim();
    let dept = this.data.departments.find(
      (d) =>
        d.id.toLowerCase() === clean.toLowerCase() ||
        d.code.toLowerCase() === clean.toLowerCase() ||
        d.name.toLowerCase() === clean.toLowerCase()
    );
    if (dept) return dept;

    // Auto-create newly typed department
    let baseCode =
      clean.length <= 6
        ? clean.toUpperCase().replace(/[^A-Z0-9]/g, '')
        : clean
            .split(/\s+/)
            .map((w) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 6);
    if (!baseCode) baseCode = 'DEPT';

    let uniqueCode = baseCode;
    let counter = 1;
    while (this.data.departments.some((d) => d.code === uniqueCode)) {
      uniqueCode = `${baseCode}${counter++}`;
    }

    const newDept: Department = {
      id: generateId('dept_' + uniqueCode.toLowerCase()),
      code: uniqueCode,
      name: clean,
      description: `Department of ${clean}`,
      createdAt: new Date().toISOString(),
    };

    this.data.departments.push(newDept);
    this.logAction(
      'CREATE_DEPARTMENT',
      actor?.username || 'admin',
      actor?.role || 'ADMIN',
      `Auto-created custom department ${newDept.name} (${newDept.code})`
    );
    this.saveData();
    return newDept;
  }

  public addDepartment(code: string, name: string, description: string, adminUser: User): Department {
    const cleanCode = code.trim().toUpperCase();
    if (this.data.departments.some(d => d.code === cleanCode)) {
      throw new Error(`Department code ${cleanCode} already exists`);
    }

    const newDept: Department = {
      id: generateId('dept'),
      code: cleanCode,
      name: name.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
    };

    this.data.departments.push(newDept);
    this.logAction('CREATE_DEPARTMENT', adminUser.username, 'ADMIN', `Created department ${newDept.name} (${newDept.code})`);
    this.saveData();
    return newDept;
  }

  public updateDepartment(deptId: string, data: { code?: string; name?: string; description?: string; hodId?: string }, adminUser: User): Department {
    if (adminUser.role !== 'ADMIN') throw new Error('Unauthorized');
    const dept = this.data.departments.find(d => d.id === deptId);
    if (!dept) throw new Error('Department not found');

    if (data.code && data.code.trim()) {
      const cleanCode = data.code.trim().toUpperCase();
      const codeExists = this.data.departments.some(d => d.id !== deptId && d.code === cleanCode);
      if (codeExists) throw new Error(`Department code ${cleanCode} already in use`);
      dept.code = cleanCode;
    }

    if (data.name && data.name.trim()) {
      dept.name = data.name.trim();
      // Sync department name to users
      this.data.users.forEach(u => {
        if (u.departmentId === deptId) u.departmentName = dept.name;
      });
      // Sync to clearances
      this.data.clearances.forEach(c => {
        if (c.studentDepartmentId === deptId) c.studentDepartmentName = dept.name;
      });
    }

    if (data.description !== undefined) {
      dept.description = data.description.trim();
    }

    if (data.hodId !== undefined) {
      if (data.hodId === '') {
        dept.hodId = undefined;
        dept.hodName = undefined;
        dept.hodEmail = undefined;
      } else {
        const hodUser = this.data.users.find(u => u.id === data.hodId && u.role === 'HOD');
        if (hodUser) {
          dept.hodId = hodUser.id;
          dept.hodName = hodUser.name;
          dept.hodEmail = hodUser.email;
          hodUser.departmentId = dept.id;
          hodUser.departmentName = dept.name;
        }
      }
    }

    this.logAction('UPDATE_DEPARTMENT', adminUser.username, 'ADMIN', `Updated department ${dept.name} (${dept.code})`);
    this.saveData();
    return dept;
  }

  public deleteDepartment(deptId: string, adminUser: User): boolean {
    if (adminUser.role !== 'ADMIN') throw new Error('Unauthorized');
    const index = this.data.departments.findIndex(d => d.id === deptId);
    if (index === -1) throw new Error('Department not found');

    const dept = this.data.departments[index];
    const studentCount = this.data.users.filter(u => u.departmentId === deptId && u.role === 'STUDENT').length;
    if (studentCount > 0) {
      throw new Error(`Cannot delete department with ${studentCount} enrolled students. Please reassign or delete students first.`);
    }

    // Unlink HODs and Staff
    this.data.users.forEach(u => {
      if (u.departmentId === deptId) {
        u.departmentId = undefined;
        u.departmentName = undefined;
      }
    });

    this.data.departments.splice(index, 1);
    this.logAction('DELETE_DEPARTMENT', adminUser.username, 'ADMIN', `Deleted department ${dept.name}`);
    this.saveData();
    return true;
  }

  // Clearances
  public syncSubjectCheckpoints(): boolean {
    let modified = false;
    const subjects = this.data.subjects || [];

    this.data.clearances.forEach((clr) => {
      // Find all subjects in this student's department
      const deptSubjects = subjects.filter((s) => s.departmentId === clr.studentDepartmentId);

      deptSubjects.forEach((subj) => {
        const checkpointKey = `subj_${subj.id}`;
        let item = clr.items.find(
          (i) => i.checkpointKey === checkpointKey || (i.subjectId && i.subjectId === subj.id)
        );

        if (!item) {
          item = {
            id: generateId('item_subj'),
            checkpointKey,
            title: `Subject: ${subj.code} - ${subj.name}`,
            category: 'DEPARTMENT',
            departmentId: subj.departmentId,
            departmentName: subj.departmentName,
            status: 'PENDING',
            dueAmount: 0,
            assignedRole: 'STAFF',
            assignedScope: `Subject: ${subj.code}`,
            subjectId: subj.id,
            subjectCode: subj.code,
            subjectName: subj.name,
            assignedStaffId: subj.assignedStaffId,
            assignedStaffName: subj.assignedStaffName,
            updatedAt: new Date().toISOString(),
          };

          // Insert before HOD checkpoint if present
          const hodIndex = clr.items.findIndex((i) => i.checkpointKey === 'dept_hod');
          if (hodIndex !== -1) {
            clr.items.splice(hodIndex, 0, item);
          } else {
            clr.items.push(item);
          }
          modified = true;
        } else {
          // Sync subject details
          const expectedTitle = `Subject: ${subj.code} - ${subj.name}`;
          if (
            item.subjectId !== subj.id ||
            item.subjectCode !== subj.code ||
            item.subjectName !== subj.name ||
            item.assignedStaffId !== subj.assignedStaffId ||
            item.assignedStaffName !== subj.assignedStaffName ||
            item.title !== expectedTitle
          ) {
            item.subjectId = subj.id;
            item.subjectCode = subj.code;
            item.subjectName = subj.name;
            item.title = expectedTitle;
            item.assignedStaffId = subj.assignedStaffId;
            item.assignedStaffName = subj.assignedStaffName;
            item.assignedScope = `Subject: ${subj.code}`;
            item.updatedAt = new Date().toISOString();
            modified = true;
          }
        }
      });

      // Remove obsolete subject checkpoints if subject was removed
      const initialLength = clr.items.length;
      clr.items = clr.items.filter(
        (i) => !i.subjectId || subjects.some((s) => s.id === i.subjectId)
      );
      if (clr.items.length !== initialLength) {
        modified = true;
      }

      // Recalculate totals
      const totalCheckpoints = clr.items.length;
      const clearedCheckpoints = clr.items.filter((i) => i.status === 'APPROVED').length;
      const totalDueAmount = clr.items.reduce((acc, curr) => acc + (curr.dueAmount || 0), 0);

      if (
        clr.totalCheckpoints !== totalCheckpoints ||
        clr.clearedCheckpoints !== clearedCheckpoints ||
        clr.totalDueAmount !== totalDueAmount
      ) {
        clr.totalCheckpoints = totalCheckpoints;
        clr.clearedCheckpoints = clearedCheckpoints;
        clr.totalDueAmount = totalDueAmount;
        if (totalDueAmount > 0) {
          clr.overallStatus = 'HAS_DUES';
        } else if (clearedCheckpoints === totalCheckpoints && totalCheckpoints > 0) {
          clr.overallStatus = 'COMPLETED';
        } else {
          clr.overallStatus = 'IN_PROGRESS';
        }
        modified = true;
      }
    });

    if (modified) {
      this.saveData();
    }
    return modified;
  }

  public getClearances(filterDeptId?: string, studentId?: string): StudentClearanceRecord[] {
    this.syncSubjectCheckpoints();
    return this.data.clearances.filter(c => {
      if (studentId && c.studentId !== studentId) return false;
      if (filterDeptId && c.studentDepartmentId !== filterDeptId) return false;
      return true;
    });
  }

  public getClearancesForStaff(staffUser: User): StudentClearanceRecord[] {
    this.syncSubjectCheckpoints();

    const staffId = staffUser.id;
    const staffCode = (staffUser.staffId || '').toUpperCase();
    const staffName = (staffUser.name || '').toLowerCase();

    // Check if staff has central office scope
    const scope = (staffUser.clearanceScope || '').toLowerCase();
    const isCentral =
      scope.includes('central') ||
      scope.includes('account') ||
      scope.includes('hostel') ||
      scope.includes('sport') ||
      scope.includes('placement');

    if (isCentral) {
      return this.data.clearances;
    }

    // Find all subjects assigned to this staff
    const assignedSubjectIds = (this.data.subjects || [])
      .filter((s) => {
        if (s.assignedStaffId && (s.assignedStaffId === staffId || s.assignedStaffId.toUpperCase() === staffCode)) {
          return true;
        }
        if (s.assignedStaffName && s.assignedStaffName.toLowerCase() === staffName) {
          return true;
        }
        return false;
      })
      .map((s) => s.id);

    return this.data.clearances.filter((clr) => {
      // 1. Any checkpoint for a subject assigned to this staff
      const hasAssignedSubject = clr.items.some(
        (i) => i.subjectId && assignedSubjectIds.includes(i.subjectId)
      );
      if (hasAssignedSubject) return true;

      // 2. Any checkpoint assigned directly to this staff ID or name
      const hasDirectItem = clr.items.some(
        (i) =>
          (i.assignedStaffId && (i.assignedStaffId === staffId || i.assignedStaffId.toUpperCase() === staffCode)) ||
          (i.assignedStaffName && i.assignedStaffName.toLowerCase() === staffName)
      );
      if (hasDirectItem) return true;

      // 3. Department matching if staff has department
      if (staffUser.departmentId && clr.studentDepartmentId === staffUser.departmentId) {
        return true;
      }

      // 4. Clearance scope match
      if (staffUser.clearanceScope) {
        const hasScopeMatch = clr.items.some((i) =>
          i.assignedScope.toLowerCase().includes(scope) || scope.includes(i.assignedScope.toLowerCase())
        );
        if (hasScopeMatch) return true;
      }

      return false;
    });
  }

  public getClearanceByStudentId(studentId: string): StudentClearanceRecord | null {
    return this.data.clearances.find(c => c.studentId === studentId) || null;
  }

  public updateClearanceAction(params: {
    studentClearanceId: string;
    itemId: string;
    action: 'APPROVE' | 'RAISE_DUE' | 'CLEAR_DUE' | 'REJECT';
    dueAmount?: number;
    dueReason?: string;
    remarks?: string;
    actor: User;
  }): StudentClearanceRecord {
    const clr = this.data.clearances.find(c => c.id === params.studentClearanceId);
    if (!clr) throw new Error('Clearance record not found');

    const item = clr.items.find(i => i.id === params.itemId);
    if (!item) throw new Error('Clearance checkpoint not found');

    // Access control:
    // Admin can approve anything.
    // HOD can approve department HOD endorsement and department items.
    // Staff can approve items corresponding to their scope / department.
    if (params.actor.role === 'STUDENT') {
      throw new Error('Students cannot modify clearance approvals');
    }

    if (params.actor.role === 'HOD') {
      if (item.category === 'DEPARTMENT' && item.departmentId && item.departmentId !== params.actor.departmentId) {
        throw new Error('HOD can only approve clearances within their assigned department');
      }
    }

    if (params.action === 'APPROVE' || params.action === 'CLEAR_DUE') {
      item.status = 'APPROVED';
      item.dueAmount = 0;
      item.clearedByUserId = params.actor.id;
      item.clearedByUserName = params.actor.name;
      item.clearedByDesignation = params.actor.designation || (params.actor.role === 'HOD' ? 'Head of Department' : 'Administrator');
      item.clearedAt = new Date().toISOString();
      if (params.remarks) item.remarks = params.remarks;
    } else if (params.action === 'RAISE_DUE') {
      item.status = 'DUE_RAISED';
      item.dueAmount = Math.max(0, Number(params.dueAmount || 0));
      item.dueReason = params.dueReason || 'Outstanding dues';
      item.remarks = params.remarks || '';
      item.clearedByUserId = params.actor.id;
      item.clearedByUserName = params.actor.name;
      item.clearedByDesignation = params.actor.designation || (params.actor.role === 'HOD' ? 'Head of Department' : 'Administrator');
    } else if (params.action === 'REJECT') {
      item.status = 'REJECTED';
      item.remarks = params.remarks || 'Clearance rejected by reviewer';
    }

    item.updatedAt = new Date().toISOString();

    // Recalculate totals
    const totalCheckpoints = clr.items.length;
    const clearedCheckpoints = clr.items.filter(i => i.status === 'APPROVED').length;
    const totalDueAmount = clr.items.reduce((acc, curr) => acc + (curr.dueAmount || 0), 0);

    clr.clearedCheckpoints = clearedCheckpoints;
    clr.totalDueAmount = totalDueAmount;

    if (totalDueAmount > 0) {
      clr.overallStatus = 'HAS_DUES';
      clr.certificateId = undefined;
      clr.certificateIssuedAt = undefined;
      clr.verificationHash = undefined;
    } else if (clearedCheckpoints === totalCheckpoints) {
      clr.overallStatus = 'COMPLETED';
      if (!clr.certificateId) {
        clr.certificateIssuedAt = new Date().toISOString();
        clr.certificateId = `NODUE-${new Date().getFullYear()}-${clr.studentRollNo}-${Math.floor(1000 + Math.random() * 9000)}`;
        clr.verificationHash = crypto
          .createHash('sha256')
          .update(`${clr.studentRollNo}_${clr.studentRegisterNo}_${clr.certificateId}_VERIFIED`)
          .digest('hex')
          .substring(0, 16)
          .toUpperCase();
      }
    } else {
      clr.overallStatus = 'IN_PROGRESS';
    }

    clr.updatedAt = new Date().toISOString();
    this.logAction(
      `CLEARANCE_${params.action}`,
      params.actor.username,
      params.actor.role,
      `${params.action} on ${item.title} for ${clr.studentName} (${clr.studentRollNo})`
    );
    this.saveData();
    return clr;
  }

  // Student pays due
  public payDue(studentClearanceId: string, itemId: string, studentUser: User, transactionNote?: string): StudentClearanceRecord {
    const clr = this.data.clearances.find(c => c.id === studentClearanceId);
    if (!clr) throw new Error('Clearance record not found');
    if (clr.studentId !== studentUser.id && studentUser.role === 'STUDENT') {
      throw new Error('Unauthorized');
    }

    const item = clr.items.find(i => i.id === itemId);
    if (!item) throw new Error('Checkpoint not found');

    const paidAmount = item.dueAmount;
    item.status = 'APPROVED';
    item.dueAmount = 0;
    item.studentProof = transactionNote || `Settled online (Ref: TXN-${Date.now().toString(36).toUpperCase()})`;
    item.clearedByUserName = 'Online Fee Gateway (Verified)';
    item.clearedByDesignation = 'Accounts / Online Settlement';
    item.clearedAt = new Date().toISOString();
    item.updatedAt = new Date().toISOString();

    // Recalculate
    const clearedCheckpoints = clr.items.filter(i => i.status === 'APPROVED').length;
    const totalDueAmount = clr.items.reduce((acc, curr) => acc + (curr.dueAmount || 0), 0);
    clr.clearedCheckpoints = clearedCheckpoints;
    clr.totalDueAmount = totalDueAmount;

    if (totalDueAmount > 0) {
      clr.overallStatus = 'HAS_DUES';
    } else if (clearedCheckpoints === clr.items.length) {
      clr.overallStatus = 'COMPLETED';
      if (!clr.certificateId) {
        clr.certificateIssuedAt = new Date().toISOString();
        clr.certificateId = `NODUE-${new Date().getFullYear()}-${clr.studentRollNo}-${Math.floor(1000 + Math.random() * 9000)}`;
        clr.verificationHash = crypto
          .createHash('sha256')
          .update(`${clr.studentRollNo}_${clr.studentRegisterNo}_${clr.certificateId}_VERIFIED`)
          .digest('hex')
          .substring(0, 16)
          .toUpperCase();
      }
    }

    clr.updatedAt = new Date().toISOString();
    this.logAction('PAY_DUE', studentUser.username, 'STUDENT', `Settled ₹${paidAmount} for ${item.title}`);
    this.saveData();
    return clr;
  }

  // Update Clearance Checkpoint Details (Direct Edit & Save)
  public updateClearanceItem(params: {
    studentClearanceId: string;
    itemId: string;
    title?: string;
    status?: ClearanceStatus;
    dueAmount?: number;
    dueReason?: string;
    remarks?: string;
    actor: User;
  }): StudentClearanceRecord {
    const clr = this.data.clearances.find(c => c.id === params.studentClearanceId);
    if (!clr) throw new Error('Clearance record not found');
    const item = clr.items.find(i => i.id === params.itemId);
    if (!item) throw new Error('Clearance checkpoint not found');

    if (params.title && params.title.trim()) item.title = params.title.trim();
    if (params.status) item.status = params.status;
    if (params.dueAmount !== undefined) item.dueAmount = Math.max(0, Number(params.dueAmount));
    if (params.dueReason !== undefined) item.dueReason = params.dueReason;
    if (params.remarks !== undefined) item.remarks = params.remarks;

    if (params.status === 'APPROVED') {
      item.clearedByUserId = params.actor.id;
      item.clearedByUserName = params.actor.name;
      item.clearedByDesignation = params.actor.designation || (params.actor.role === 'HOD' ? 'Head of Department' : 'Administrator');
      item.clearedAt = new Date().toISOString();
      item.dueAmount = 0;
    }

    item.updatedAt = new Date().toISOString();

    // Recalculate
    const clearedCheckpoints = clr.items.filter(i => i.status === 'APPROVED').length;
    const totalDueAmount = clr.items.reduce((acc, curr) => acc + (curr.dueAmount || 0), 0);
    clr.clearedCheckpoints = clearedCheckpoints;
    clr.totalDueAmount = totalDueAmount;

    if (totalDueAmount > 0) {
      clr.overallStatus = 'HAS_DUES';
    } else if (clearedCheckpoints === clr.items.length && clr.items.length > 0) {
      clr.overallStatus = 'COMPLETED';
      if (!clr.certificateId) {
        clr.certificateIssuedAt = new Date().toISOString();
        clr.certificateId = `NODUE-${new Date().getFullYear()}-${clr.studentRollNo}-${Math.floor(1000 + Math.random() * 9000)}`;
        clr.verificationHash = crypto
          .createHash('sha256')
          .update(`${clr.studentRollNo}_${clr.studentRegisterNo}_${clr.certificateId}_VERIFIED`)
          .digest('hex')
          .substring(0, 16)
          .toUpperCase();
      }
    } else {
      clr.overallStatus = 'IN_PROGRESS';
    }
    clr.updatedAt = new Date().toISOString();

    this.logAction('UPDATE_CHECKPOINT', params.actor.username, params.actor.role, `Updated checkpoint ${item.title} for ${clr.studentName} (${clr.studentRollNo})`);
    this.saveData();
    return clr;
  }

  // Add Custom Clearance Checkpoint
  public addClearanceCheckpoint(studentClearanceId: string, checkpoint: {
    title: string;
    category?: 'DEPARTMENT' | 'CENTRAL';
    assignedScope?: string;
    dueAmount?: number;
    dueReason?: string;
    remarks?: string;
  }, actor: User): StudentClearanceRecord {
    const clr = this.data.clearances.find(c => c.id === studentClearanceId);
    if (!clr) throw new Error('Clearance record not found');

    const newItem: ClearanceItem = {
      id: generateId('item'),
      checkpointKey: `custom_${Date.now()}`,
      title: checkpoint.title.trim(),
      category: checkpoint.category || 'DEPARTMENT',
      departmentId: clr.studentDepartmentId,
      departmentName: clr.studentDepartmentName,
      status: (checkpoint.dueAmount && checkpoint.dueAmount > 0) ? 'DUE_RAISED' : 'PENDING',
      dueAmount: Number(checkpoint.dueAmount || 0),
      dueReason: checkpoint.dueReason,
      remarks: checkpoint.remarks,
      assignedRole: 'STAFF',
      assignedScope: checkpoint.assignedScope || 'Department Office',
      updatedAt: new Date().toISOString(),
    };

    clr.items.push(newItem);
    clr.totalCheckpoints = clr.items.length;
    clr.clearedCheckpoints = clr.items.filter(i => i.status === 'APPROVED').length;
    clr.totalDueAmount = clr.items.reduce((acc, curr) => acc + (curr.dueAmount || 0), 0);
    if (clr.totalDueAmount > 0) clr.overallStatus = 'HAS_DUES';
    clr.updatedAt = new Date().toISOString();

    this.logAction('ADD_CHECKPOINT', actor.username, actor.role, `Added checkpoint ${newItem.title} for ${clr.studentName}`);
    this.saveData();
    return clr;
  }

  // Delete Clearance Checkpoint
  public deleteClearanceCheckpoint(studentClearanceId: string, itemId: string, actor: User): StudentClearanceRecord {
    const clr = this.data.clearances.find(c => c.id === studentClearanceId);
    if (!clr) throw new Error('Clearance record not found');

    const index = clr.items.findIndex(i => i.id === itemId);
    if (index === -1) throw new Error('Clearance checkpoint not found');

    const [deleted] = clr.items.splice(index, 1);
    clr.totalCheckpoints = clr.items.length;
    clr.clearedCheckpoints = clr.items.filter(i => i.status === 'APPROVED').length;
    clr.totalDueAmount = clr.items.reduce((acc, curr) => acc + (curr.dueAmount || 0), 0);
    if (clr.totalDueAmount > 0) clr.overallStatus = 'HAS_DUES';
    else if (clr.clearedCheckpoints === clr.items.length && clr.items.length > 0) clr.overallStatus = 'COMPLETED';
    else clr.overallStatus = 'IN_PROGRESS';
    clr.updatedAt = new Date().toISOString();

    this.logAction('DELETE_CHECKPOINT', actor.username, actor.role, `Deleted checkpoint ${deleted.title} from ${clr.studentName}`);
    this.saveData();
    return clr;
  }

  // --- SUBJECTS & FACULTY ALLOCATION ---
  public getSubjects(departmentId?: string, staffId?: string, semester?: number): Subject[] {
    let list = this.data.subjects || [];

    if (departmentId) {
      list = list.filter((s) => s.departmentId === departmentId);
    }

    if (staffId) {
      const cleanStaffId = staffId.trim().toLowerCase();
      const staffUser = this.data.users.find(
        (u) =>
          u.id.toLowerCase() === cleanStaffId ||
          (u.staffId && u.staffId.toLowerCase() === cleanStaffId) ||
          (u.username && u.username.toLowerCase() === cleanStaffId)
      );

      list = list.filter((s) => {
        if (!s.assignedStaffId && !s.assignedStaffName) return false;
        if (s.assignedStaffId && s.assignedStaffId.toLowerCase() === cleanStaffId) return true;
        if (staffUser) {
          if (s.assignedStaffId && s.assignedStaffId.toLowerCase() === staffUser.id.toLowerCase()) return true;
          if (staffUser.staffId && s.assignedStaffId && s.assignedStaffId.toLowerCase() === staffUser.staffId.toLowerCase()) return true;
          if (staffUser.name && s.assignedStaffName && s.assignedStaffName.toLowerCase() === staffUser.name.toLowerCase()) return true;
        }
        return false;
      });
    }

    if (semester !== undefined && !isNaN(semester) && semester > 0) {
      list = list.filter((s) => s.semester === semester);
    }

    return list;
  }

  public getSubjectById(id: string): Subject | undefined {
    return (this.data.subjects || []).find((s) => s.id === id);
  }

  public createSubject(
    params: {
      code: string;
      name: string;
      departmentId: string;
      semester: number;
      type: 'THEORY' | 'PRACTICAL' | 'PROJECT';
      credits?: number;
      assignedStaffId?: string;
      batchYear?: string;
      description?: string;
    },
    actor: User
  ): Subject {
    this.data.subjects = this.data.subjects || [];

    const cleanCode = (params.code || '').trim().toUpperCase();
    const cleanName = (params.name || '').trim();

    if (!cleanCode || !cleanName) {
      throw new Error('Subject code and subject name are mandatory');
    }

    // Check duplicate code in same department and semester
    const existing = this.data.subjects.find(
      (s) => s.code.toUpperCase() === cleanCode && s.departmentId === params.departmentId
    );
    if (existing) {
      throw new Error(`Subject with code ${cleanCode} already exists in this department.`);
    }

    const dept = this.ensureDepartment(params.departmentId, actor);

    let assignedStaffName: string | undefined;
    let assignedStaffDesignation: string | undefined;
    let assignedStaffId = params.assignedStaffId ? params.assignedStaffId.trim() : undefined;

    if (assignedStaffId) {
      const staffUser = this.data.users.find((u) => u.id === assignedStaffId);
      if (staffUser) {
        assignedStaffId = staffUser.id;
        assignedStaffName = staffUser.name;
        assignedStaffDesignation = staffUser.designation || 'Staff / Faculty';
      } else {
        // Custom typed faculty name
        assignedStaffName = assignedStaffId;
        assignedStaffDesignation = 'Allocated Faculty';
      }
    }

    const newSubject: Subject = {
      id: generateId('subj'),
      code: cleanCode,
      name: cleanName,
      departmentId: dept.id,
      departmentCode: dept.code,
      departmentName: dept.name,
      semester: Number(params.semester) || 1,
      type: params.type || 'THEORY',
      credits: Number(params.credits) || 3,
      batchYear: params.batchYear || '2021 - 2025',
      assignedStaffId: assignedStaffId || undefined,
      assignedStaffName,
      assignedStaffDesignation,
      description: params.description?.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.subjects.push(newSubject);
    this.logAction(
      'CREATE_SUBJECT',
      actor.username,
      actor.role,
      `Created subject ${cleanCode} (${cleanName}) in ${dept.code}${assignedStaffName ? `, allocated to ${assignedStaffName}` : ''}`
    );
    this.syncSubjectCheckpoints();
    this.saveData();

    return newSubject;
  }

  public updateSubject(id: string, updates: Partial<Subject>, actor: User): Subject {
    this.data.subjects = this.data.subjects || [];
    const index = this.data.subjects.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error('Subject not found');
    }

    const subj = this.data.subjects[index];

    // Department verification if updated
    if (updates.departmentId && updates.departmentId !== subj.departmentId) {
      const dept = this.ensureDepartment(updates.departmentId, actor);
      subj.departmentId = dept.id;
      subj.departmentCode = dept.code;
      subj.departmentName = dept.name;
    }

    if (updates.code) {
      subj.code = updates.code.trim().toUpperCase();
    }
    if (updates.name) {
      subj.name = updates.name.trim();
    }
    if (updates.semester !== undefined) {
      subj.semester = Number(updates.semester);
    }
    if (updates.type) {
      subj.type = updates.type;
    }
    if (updates.credits !== undefined) {
      subj.credits = Number(updates.credits);
    }
    if (updates.batchYear !== undefined) {
      subj.batchYear = updates.batchYear;
    }
    if (updates.description !== undefined) {
      subj.description = updates.description.trim();
    }

    // Handle faculty allocation or deallocation
    if ('assignedStaffId' in updates) {
      const staffVal = updates.assignedStaffId ? updates.assignedStaffId.trim() : '';
      if (staffVal) {
        const staffUser = this.data.users.find((u) => u.id === staffVal);
        if (staffUser) {
          subj.assignedStaffId = staffUser.id;
          subj.assignedStaffName = staffUser.name;
          subj.assignedStaffDesignation = staffUser.designation || 'Staff / Faculty';
        } else {
          // Custom typed faculty name
          subj.assignedStaffId = 'custom_' + staffVal.toLowerCase().replace(/[^a-z0-9]/g, '_');
          subj.assignedStaffName = staffVal;
          subj.assignedStaffDesignation = 'Allocated Faculty';
        }
      } else {
        subj.assignedStaffId = undefined;
        subj.assignedStaffName = undefined;
        subj.assignedStaffDesignation = undefined;
      }
    }

    subj.updatedAt = new Date().toISOString();

    this.logAction(
      'UPDATE_SUBJECT',
      actor.username,
      actor.role,
      `Updated subject ${subj.code} (${subj.name})${subj.assignedStaffName ? `, allocated to ${subj.assignedStaffName}` : ''}`
    );
    this.syncSubjectCheckpoints();
    this.saveData();

    return subj;
  }

  public allocateSubjectStaff(subjectId: string, staffId: string, actor: User): Subject {
    return this.updateSubject(subjectId, { assignedStaffId: staffId }, actor);
  }

  public deleteSubject(id: string, actor: User): boolean {
    this.data.subjects = this.data.subjects || [];
    const index = this.data.subjects.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error('Subject not found');
    }

    const deleted = this.data.subjects.splice(index, 1)[0];
    this.logAction(
      'DELETE_SUBJECT',
      actor.username,
      actor.role,
      `Deleted subject ${deleted.code} (${deleted.name}) from ${deleted.departmentName}`
    );
    this.syncSubjectCheckpoints();
    this.saveData();

    return true;
  }

  // System Stats
  public getStats(): SystemStats {
    const students = this.data.users.filter(u => u.role === 'STUDENT');
    const hods = this.data.users.filter(u => u.role === 'HOD');
    const staffs = this.data.users.filter(u => u.role === 'STAFF');
    const departments = this.data.departments;

    const fullyClearedStudents = this.data.clearances.filter(c => c.overallStatus === 'COMPLETED').length;
    const pendingClearances = this.data.clearances.filter(c => c.overallStatus !== 'COMPLETED').length;

    let totalDuesRaisedAmount = 0;
    this.data.clearances.forEach(clr => {
      clr.items.forEach(i => {
        if (i.dueAmount > 0) totalDuesRaisedAmount += i.dueAmount;
      });
    });

    let totalDuesCollectedAmount = 0;
    this.data.clearances.forEach(clr => {
      clr.items.forEach(i => {
        if (i.studentProof && i.status === 'APPROVED') {
          totalDuesCollectedAmount += (i.dueAmount || 0);
        }
      });
    });

    return {
      totalStudents: students.length,
      totalHods: hods.length,
      totalStaffs: staffs.length,
      totalDepartments: departments.length,
      totalSubjects: (this.data.subjects || []).length,
      fullyClearedStudents,
      pendingClearances,
      totalDuesRaisedAmount,
      totalDuesCollectedAmount,
    };
  }

  private logAction(action: string, performedBy: string, performedByRole: string, details: string) {
    this.data.auditLogs.unshift({
      id: generateId('log'),
      action,
      performedBy,
      performedByRole,
      details,
      timestamp: new Date().toISOString(),
    });
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.pop();
    }
  }

  public getAuditLogs(limit: number = 50) {
    return this.data.auditLogs.slice(0, limit);
  }
}

export const db = new Database();
