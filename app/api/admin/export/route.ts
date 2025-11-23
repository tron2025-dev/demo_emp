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
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const type = searchParams.get('type') || 'attendance';

        if (type === 'attendance') {
            let query;
            if (startDate && endDate) {
                query = sql`
          SELECT 
            e.name, e.email, e.department, e.designation,
            a.date, a.clock_in, a.clock_out, a.total_hours, a.status
          FROM attendance a
          JOIN employees e ON a.employee_id = e.id
          WHERE a.date >= ${startDate} AND a.date <= ${endDate}
          ORDER BY a.date DESC, e.name
        `;
            } else {
                query = sql`
          SELECT 
            e.name, e.email, e.department, e.designation,
            a.date, a.clock_in, a.clock_out, a.total_hours, a.status
          FROM attendance a
          JOIN employees e ON a.employee_id = e.id
          WHERE a.date >= CURRENT_DATE - INTERVAL '30 days'
          ORDER BY a.date DESC, e.name
        `;
            }

            const data = await query;

            // Convert to CSV
            const headers = ['Name', 'Email', 'Department', 'Designation', 'Date', 'Clock In', 'Clock Out', 'Total Hours', 'Status'];
            const csvRows = [headers.join(',')];

            for (const row of data) {
                const values = [
                    row.name,
                    row.email,
                    row.department || '',
                    row.designation || '',
                    row.date,
                    row.clock_in || '',
                    row.clock_out || '',
                    row.total_hours || '',
                    row.status,
                ];
                csvRows.push(values.map(v => `"${v}"`).join(','));
            }

            const csv = csvRows.join('\n');

            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="attendance_${startDate || 'recent'}_${endDate || 'recent'}.csv"`,
                },
            });

        } else if (type === 'reports') {
            let query;
            if (startDate && endDate) {
                query = sql`
          SELECT 
            e.name, e.email, e.department,
            dr.date, dr.tasks_summary, dr.time_spent_hours, 
            dr.blockers, dr.tomorrow_plan, dr.project_client, dr.status
          FROM daily_reports dr
          JOIN employees e ON dr.employee_id = e.id
          WHERE dr.date >= ${startDate} AND dr.date <= ${endDate}
          ORDER BY dr.date DESC, e.name
        `;
            } else {
                query = sql`
          SELECT 
            e.name, e.email, e.department,
            dr.date, dr.tasks_summary, dr.time_spent_hours, 
            dr.blockers, dr.tomorrow_plan, dr.project_client, dr.status
          FROM daily_reports dr
          JOIN employees e ON dr.employee_id = e.id
          WHERE dr.date >= CURRENT_DATE - INTERVAL '30 days'
          ORDER BY dr.date DESC, e.name
        `;
            }

            const data = await query;

            // Convert to CSV
            const headers = ['Name', 'Email', 'Department', 'Date', 'Tasks Summary', 'Time Spent (hrs)', 'Blockers', 'Tomorrow Plan', 'Project/Client', 'Status'];
            const csvRows = [headers.join(',')];

            for (const row of data) {
                const values = [
                    row.name,
                    row.email,
                    row.department || '',
                    row.date,
                    row.tasks_summary,
                    row.time_spent_hours || '',
                    row.blockers || '',
                    row.tomorrow_plan || '',
                    row.project_client || '',
                    row.status,
                ];
                csvRows.push(values.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
            }

            const csv = csvRows.join('\n');

            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="reports_${startDate || 'recent'}_${endDate || 'recent'}.csv"`,
                },
            });
        }

        return NextResponse.json(
            { error: 'Invalid export type' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
