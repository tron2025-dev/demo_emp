import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const reportSchema = z.object({
    date: z.string().optional(),
    tasks_summary: z.string().min(10, 'Tasks summary must be at least 10 characters'),
    time_spent_hours: z.number().min(0).max(24).optional(),
    blockers: z.string().optional(),
    tomorrow_plan: z.string().optional(),
    project_client: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validatedData = reportSchema.parse(body);

        const reportDate = validatedData.date || new Date().toISOString().split('T')[0];

        // Check if report already exists for this date
        const existing = await sql`
      SELECT id FROM daily_reports
      WHERE employee_id = ${currentUser.userId} AND date = ${reportDate}
    `;

        if (existing.length > 0) {
            // Update existing report
            const result = await sql`
        UPDATE daily_reports
        SET 
          tasks_summary = ${validatedData.tasks_summary},
          time_spent_hours = ${validatedData.time_spent_hours || null},
          blockers = ${validatedData.blockers || null},
          tomorrow_plan = ${validatedData.tomorrow_plan || null},
          project_client = ${validatedData.project_client || null},
          updated_at = NOW()
        WHERE id = ${existing[0].id}
        RETURNING *
      `;

            return NextResponse.json({
                message: 'Report updated successfully',
                report: result[0],
            });
        } else {
            // Create new report
            const result = await sql`
        INSERT INTO daily_reports (
          employee_id, date, tasks_summary, time_spent_hours, 
          blockers, tomorrow_plan, project_client, status
        ) VALUES (
          ${currentUser.userId},
          ${reportDate},
          ${validatedData.tasks_summary},
          ${validatedData.time_spent_hours || null},
          ${validatedData.blockers || null},
          ${validatedData.tomorrow_plan || null},
          ${validatedData.project_client || null},
          'PENDING'
        )
        RETURNING *
      `;

            return NextResponse.json({
                message: 'Report submitted successfully',
                report: result[0],
            }, { status: 201 });
        }

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Submit report error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

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
        SELECT dr.*, e.name as employee_name, e.email as employee_email
        FROM daily_reports dr
        JOIN employees e ON dr.employee_id = e.id
        WHERE dr.employee_id = ${targetEmployeeId}
          AND dr.date >= ${startDate}
          AND dr.date <= ${endDate}
        ORDER BY dr.date DESC
      `;
        } else {
            // Get last 30 days
            query = sql`
        SELECT dr.*, e.name as employee_name, e.email as employee_email
        FROM daily_reports dr
        JOIN employees e ON dr.employee_id = e.id
        WHERE dr.employee_id = ${targetEmployeeId}
          AND dr.date >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY dr.date DESC
      `;
        }

        const reports = await query;

        return NextResponse.json({ reports });

    } catch (error) {
        console.error('Get reports error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
