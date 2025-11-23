import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const clockInSchema = z.object({
    status: z.enum(['PRESENT', 'WFH']).default('PRESENT'),
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
        const validatedData = clockInSchema.parse(body);

        const today = new Date().toISOString().split('T')[0];

        // Check if already clocked in today
        const existing = await sql`
      SELECT id, clock_in FROM attendance
      WHERE employee_id = ${currentUser.userId} AND date = ${today}
    `;

        if (existing.length > 0 && existing[0].clock_in) {
            return NextResponse.json(
                { error: 'Already clocked in today' },
                { status: 400 }
            );
        }

        // Clock in
        const result = await sql`
      INSERT INTO attendance (employee_id, date, clock_in, status)
      VALUES (${currentUser.userId}, ${today}, NOW(), ${validatedData.status})
      ON CONFLICT (employee_id, date)
      DO UPDATE SET clock_in = NOW(), status = ${validatedData.status}, updated_at = NOW()
      RETURNING *
    `;

        return NextResponse.json({
            message: 'Clocked in successfully',
            attendance: result[0],
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Clock in error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
