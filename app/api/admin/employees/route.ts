import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { z } from 'zod';

const createEmployeeSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    phone: z.string().optional(),
    department: z.string().optional(),
    designation: z.string().optional(),
    role: z.enum(['EMPLOYEE', 'ADMIN']).default('EMPLOYEE'),
});

const updateEmployeeSchema = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    department: z.string().optional(),
    designation: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export async function GET() {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser || currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const employees = await sql`
      SELECT id, name, email, phone, role, department, designation, 
             date_joined, status, created_at
      FROM employees
      ORDER BY created_at DESC
    `;

        return NextResponse.json({ employees });

    } catch (error) {
        console.error('Get employees error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser || currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const validatedData = createEmployeeSchema.parse(body);

        // Check if email already exists
        const existing = await sql`
      SELECT id FROM employees WHERE email = ${validatedData.email}
    `;

        if (existing.length > 0) {
            return NextResponse.json(
                { error: 'Email already exists' },
                { status: 400 }
            );
        }

        const passwordHash = await hashPassword(validatedData.password);

        const result = await sql`
      INSERT INTO employees (
        name, email, phone, password_hash, department, designation, role, status
      ) VALUES (
        ${validatedData.name},
        ${validatedData.email},
        ${validatedData.phone || null},
        ${passwordHash},
        ${validatedData.department || null},
        ${validatedData.designation || null},
        ${validatedData.role},
        'ACTIVE'
      )
      RETURNING id, name, email, phone, role, department, designation, status
    `;

        return NextResponse.json({
            message: 'Employee created successfully',
            employee: result[0],
        }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Create employee error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser || currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Employee ID is required' },
                { status: 400 }
            );
        }

        const validatedData = updateEmployeeSchema.parse(updates);

        // Build dynamic update query
        const updateFields = [];
        const values = [];

        if (validatedData.name) {
            updateFields.push('name = $' + (values.length + 1));
            values.push(validatedData.name);
        }
        if (validatedData.phone !== undefined) {
            updateFields.push('phone = $' + (values.length + 1));
            values.push(validatedData.phone);
        }
        if (validatedData.department !== undefined) {
            updateFields.push('department = $' + (values.length + 1));
            values.push(validatedData.department);
        }
        if (validatedData.designation !== undefined) {
            updateFields.push('designation = $' + (values.length + 1));
            values.push(validatedData.designation);
        }
        if (validatedData.status) {
            updateFields.push('status = $' + (values.length + 1));
            values.push(validatedData.status);
        }

        if (updateFields.length === 0) {
            return NextResponse.json(
                { error: 'No fields to update' },
                { status: 400 }
            );
        }

        const result = await sql`
      UPDATE employees
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, email, phone, role, department, designation, status
    `;

        if (result.length === 0) {
            return NextResponse.json(
                { error: 'Employee not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'Employee updated successfully',
            employee: result[0],
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Update employee error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
