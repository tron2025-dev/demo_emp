import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const employeeId = searchParams.get('employeeId');

        // Check if admin is requesting other employee's data
        const targetEmployeeId = employeeId && currentUser.role === 'ADMIN'
            ? parseInt(employeeId)
            : currentUser.userId;

        let query;
        if (startDate && endDate) {
            query = sql`
        SELECT a.*, e.name as employee_name, e.email as employee_email
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        WHERE a.employee_id = ${targetEmployeeId}
          AND a.date >= ${startDate}
          AND a.date <= ${endDate}
        ORDER BY a.date DESC
      `;
        } else {
            // Get last 30 days
            query = sql`
        SELECT a.*, e.name as employee_name, e.email as employee_email
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        WHERE a.employee_id = ${targetEmployeeId}
          AND a.date >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY a.date DESC
      `;
        }

        const attendance = await query;

        return NextResponse.json({ attendance });

    } catch (error) {
        console.error('Get attendance error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
