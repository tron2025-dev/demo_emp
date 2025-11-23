const { Pool } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_mO9YhTxpBKN3@ep-ancient-glitter-a4odixfp-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function createAdmin() {
    const pool = new Pool({ connectionString: DATABASE_URL });
    const client = await pool.connect();

    try {
        const adminEmail = 'admin@company.com';
        const adminPassword = 'pass12';
        const adminName = 'Admin User';

        // Check if admin already exists
        const existingUser = await client.query(
            `SELECT id, email, role FROM employees WHERE email = $1`,
            [adminEmail]
        );

        if (existingUser.rows.length > 0) {
            const user = existingUser.rows[0];
            if (user.role === 'ADMIN') {
                console.log('✅ Admin user already exists:', user.email);
                return;
            } else {
                // Promote existing user to admin
                await client.query(
                    `UPDATE employees SET role = 'ADMIN' WHERE email = $1`,
                    [adminEmail]
                );
                console.log('✅ Existing user promoted to admin:', adminEmail);
                return;
            }
        }

        // Hash the password
        const passwordHash = await bcrypt.hash(adminPassword, 10);

        // Create new admin user
        const result = await client.query(
            `INSERT INTO employees (name, email, password_hash, role, status, department)
             VALUES ($1, $2, $3, 'ADMIN', 'ACTIVE', 'Administration')
             RETURNING id, name, email, role`,
            [adminName, adminEmail, passwordHash]
        );

        console.log('✅ Admin user created successfully:');
        console.log('   Email:', adminEmail);
        console.log('   Password: pass12');
        console.log('   Role:', result.rows[0].role);
        console.log('\n🔐 Login credentials:');
        console.log('   Email: admin@company.com');
        console.log('   Password: pass12');

    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

createAdmin();
