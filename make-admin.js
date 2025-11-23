const { Pool } = require('@neondatabase/serverless');

const DATABASE_URL = 'postgresql://neondb_owner:npg_mO9YhTxpBKN3@ep-ancient-glitter-a4odixfp-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function makeAdmin(email) {
    const pool = new Pool({ connectionString: DATABASE_URL });
    const client = await pool.connect();

    try {
        const result = await client.query(
            `UPDATE employees SET role = 'ADMIN' WHERE email = $1 RETURNING name, email, role`,
            [email]
        );

        if (result.rows.length > 0) {
            console.log('✅ User promoted to admin:', result.rows[0]);
        } else {
            console.log('❌ User not found with email:', email);
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
    console.log('Usage: node make-admin.js <email>');
    console.log('Example: node make-admin.js john@example.com');
    process.exit(1);
}

makeAdmin(email);
