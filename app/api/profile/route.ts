import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const updateProfileSchema = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    department: z.string().optional(),
    designation: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validatedData = updateProfileSchema.parse(body);

        // Build update query dynamically
        const updates: string[] = [];
        if (validatedData.name) updates.push(`name = '${validatedData.name}'`);
        if (validatedData.phone !== undefined) updates.push(`phone = '${validatedData.phone}'`);
        if (validatedData.department !== undefined) updates.push(`department = '${validatedData.department}'`);
        if (validatedData.designation !== undefined) updates.push(`designation = '${validatedData.designation}'`);

        if (updates.length === 0) {
            return NextResponse.json(
                { error: 'No fields to update' },
                { status: 400 }
            );
        }

        const result = await sql`
      UPDATE employees
      SET 
        name = ${validatedData.name || sql`name`},
        phone = ${validatedData.phone !== undefined ? validatedData.phone : sql`phone`},
        department = ${validatedData.department !== undefined ? validatedData.department : sql`department`},
        designation = ${validatedData.designation !== undefined ? validatedData.designation : sql`designation`},
        updated_at = NOW()
      WHERE id = ${currentUser.userId}
      RETURNING id, name, email, phone, role, department, designation, date_joined, status
    `;

        return NextResponse.json({
            message: 'Profile updated successfully',
            user: result[0],
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Update profile error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
