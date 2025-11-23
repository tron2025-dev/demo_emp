const { Pool } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

const DATABASE_URL = 'postgresql://neondb_owner:npg_mO9YhTxpBKN3@ep-ancient-glitter-a4odixfp-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function checkAdmin() {
    const pool = new Pool({ connectionString: DATABASE_URL });
    const client = await pool.connect();

    try {
        // Check if admin user exists
        const result = await client.query(
            `SELECT id, name, email, role, status FROM employees WHERE email = $1`,
            ['admin@company.com']
        );

        if (result.rows.length === 0) {
            console.log('❌ Admin user does not exist. Creating now...');

            // Hash the password 'admin123'
            const passwordHash = await bcrypt.hash('admin123', 10);

            // Create admin user
            const createResult = await client.query(
                `INSERT INTO employees (name, email, phone, role, password_hash, department, designation, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, name, email, role`,
                ['Admin User', 'admin@company.com', '1234567890', 'ADMIN', passwordHash, 'Management', 'System Administrator', 'ACTIVE']
            );

            console.log('✅ Admin user created:', createResult.rows[0]);
        } else {
            console.log('✅ Admin user exists:', result.rows[0]);

            // Update password to ensure it's correct
            const passwordHash = await bcrypt.hash('admin123', 10);
            await client.query(
                `UPDATE employees SET password_hash = $1, role = 'ADMIN', status = 'ACTIVE' WHERE email = $2`,
                [passwordHash, 'admin@company.com']
            );
            console.log('✅ Admin password reset to: admin123');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

checkAdmin();
