import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST() {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const today = new Date().toISOString().split('T')[0];

        // Get today's attendance
        const existing = await sql`
      SELECT id, clock_in, clock_out FROM attendance
      WHERE employee_id = ${currentUser.userId} AND date = ${today}
    `;

        if (existing.length === 0 || !existing[0].clock_in) {
            return NextResponse.json(
                { error: 'You must clock in first' },
                { status: 400 }
            );
        }

        if (existing[0].clock_out) {
            return NextResponse.json(
                { error: 'Already clocked out today' },
                { status: 400 }
            );
        }

        // Clock out and calculate total hours
        const result = await sql`
      UPDATE attendance
      SET 
        clock_out = NOW(),
        total_hours = EXTRACT(EPOCH FROM (NOW() - clock_in)) / 3600,
        updated_at = NOW()
      WHERE id = ${existing[0].id}
      RETURNING *
    `;

        return NextResponse.json({
            message: 'Clocked out successfully',
            attendance: result[0],
        });

    } catch (error) {
        console.error('Clock out error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
