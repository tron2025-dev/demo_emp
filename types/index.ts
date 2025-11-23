export type UserRole = 'EMPLOYEE' | 'ADMIN';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'WFH';
export type LeaveType = 'SICK' | 'CASUAL' | 'EARNED' | 'UNPAID';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Employee {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    password_hash: string;
    department?: string;
    designation?: string;
    date_joined: Date;
    status: EmployeeStatus;
    created_at: Date;
    updated_at: Date;
}

export interface Attendance {
    id: number;
    employee_id: number;
    date: Date;
    clock_in?: Date;
    clock_out?: Date;
    total_hours?: number;
    status: AttendanceStatus;
    created_at: Date;
    updated_at: Date;
}

export interface DailyReport {
    id: number;
    employee_id: number;
    date: Date;
    tasks_summary: string;
    time_spent_hours?: number;
    blockers?: string;
    tomorrow_plan?: string;
    project_client?: string;
    status: ApprovalStatus;
    created_at: Date;
    updated_at: Date;
}

export interface Leave {
    id: number;
    employee_id: number;
    from_date: Date;
    to_date: Date;
    leave_type: LeaveType;
    reason?: string;
    status: ApprovalStatus;
    created_at: Date;
    updated_at: Date;
}

export type EmployeeWithoutPassword = Omit<Employee, 'password_hash'>;

export interface AttendanceWithEmployee extends Attendance {
    employee_name?: string;
    employee_email?: string;
}

export interface DailyReportWithEmployee extends DailyReport {
    employee_name?: string;
    employee_email?: string;
}
