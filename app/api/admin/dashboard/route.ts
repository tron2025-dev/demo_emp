import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser || currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

        // Get all employees with their attendance for the specified date
        const attendanceData = await sql`
      SELECT 
        e.id as employee_id,
        e.name,
        e.email,
        e.department,
        e.designation,
        a.date,
        a.clock_in,
        a.clock_out,
        a.total_hours,
        a.status,
        dr.id as report_id,
        dr.status as report_status
      FROM employees e
      LEFT JOIN attendance a ON e.id = a.employee_id AND a.date = ${date}
      LEFT JOIN daily_reports dr ON e.id = dr.employee_id AND dr.date = ${date}
      WHERE e.status = 'ACTIVE' AND e.role = 'EMPLOYEE'
      ORDER BY e.name
    `;

        const attendance = attendanceData as unknown as AttendanceRecord[];

        interface AttendanceRecord {
            status: string;
            clock_in: string | null;
            clock_out: string | null;
            report_id: number | null;
        }

        // Calculate statistics
        const stats = {
            total: attendance.length,
            present: attendance.filter((a: AttendanceRecord) => a.status === 'PRESENT' || a.status === 'WFH').length,
            absent: attendance.filter((a: AttendanceRecord) => !a.status || a.status === 'ABSENT').length,
            leave: attendance.filter((a: AttendanceRecord) => a.status === 'LEAVE').length,
            halfDay: attendance.filter((a: AttendanceRecord) => a.status === 'HALF_DAY').length,
            missingClockOut: attendance.filter((a: AttendanceRecord) => a.clock_in && !a.clock_out).length,
            missingReport: attendance.filter((a: AttendanceRecord) => !a.report_id).length,
        };

        return NextResponse.json({ attendance, stats });

    } catch (error) {
        console.error('Get dashboard error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
