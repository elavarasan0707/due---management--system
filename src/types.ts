export type UserRole = 'ADMIN' | 'HOD' | 'STAFF' | 'STUDENT';

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  hodId?: string;
  hodName?: string;
  hodEmail?: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string; // Roll number for student, Staff ID for staff/HOD, or email/admin
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  departmentId?: string;
  departmentName?: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  allocatedBy?: string; // ID of the HOD or Admin who registered this user
  allocatedByName?: string;
  createdAt: string;

  // Student specific
  rollNo?: string;
  registerNo?: string;
  degree?: string; // B.E., B.Tech, M.E., MBA
  batchYear?: string; // e.g. "2021 - 2025"
  semester?: number; // e.g. 8
  isHosteler?: boolean;

  // Staff specific
  staffId?: string;
  designation?: string;
  clearanceScope?: string; // e.g., "Computer Labs", "Class Advisor", "Department Library", "Central Library", "College Fees", "Hostel Dues"
}

export type ClearanceStatus = 'PENDING' | 'DUE_RAISED' | 'APPROVED' | 'REJECTED';

export interface ClearanceItem {
  id: string;
  checkpointKey: string; // e.g. "dept_advisor", "dept_lab", "dept_library", "dept_hod", "central_library", "accounts", "hostel", "sports"
  title: string;
  category: 'DEPARTMENT' | 'CENTRAL';
  departmentId?: string;
  departmentName?: string;
  status: ClearanceStatus;
  dueAmount: number; // in INR (₹)
  dueReason?: string;
  remarks?: string;
  studentProof?: string; // optional receipt number or note submitted by student
  assignedRole: 'STAFF' | 'HOD' | 'ADMIN';
  assignedScope: string;
  subjectId?: string;
  subjectCode?: string;
  subjectName?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  clearedByUserId?: string;
  clearedByUserName?: string;
  clearedByDesignation?: string;
  clearedAt?: string;
  updatedAt: string;
}

export interface StudentClearanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  studentRegisterNo: string;
  studentDepartmentId: string;
  studentDepartmentName: string;
  degree: string;
  batchYear: string;
  semester: number;
  isHosteler: boolean;
  totalCheckpoints: number;
  clearedCheckpoints: number;
  totalDueAmount: number;
  overallStatus: 'IN_PROGRESS' | 'COMPLETED' | 'HAS_DUES';
  items: ClearanceItem[];
  certificateIssuedAt?: string;
  certificateId?: string;
  verificationHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  code: string; // e.g. CS8651
  name: string; // e.g. Internet Programming
  departmentId: string;
  departmentCode?: string;
  departmentName?: string;
  semester: number; // 1 to 8
  type: 'THEORY' | 'PRACTICAL' | 'PROJECT';
  credits?: number;
  batchYear?: string; // e.g. "2021 - 2025"
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignedStaffDesignation?: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SystemStats {
  totalStudents: number;
  totalHods: number;
  totalStaffs: number;
  totalDepartments: number;
  totalSubjects?: number;
  fullyClearedStudents: number;
  pendingClearances: number;
  totalDuesRaisedAmount: number;
  totalDuesCollectedAmount: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}
