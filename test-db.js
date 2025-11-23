const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

const DATABASE_URL = 'postgresql://neondb_owner:npg_mO9YhTxpBKN3@ep-ancient-glitter-a4odixfp-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function testDatabase() {
    try {
        const sql = neon(DATABASE_URL);

        console.log('Testing database connection...');
        const result = await sql`SELECT 1 as test`;
        console.log('✓ Database connection successful:', result);

        console.log('\nChecking if employees table exists...');
        const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'employees'
    `;

        if (tables.length === 0) {
            console.log('✗ employees table does not exist');
            console.log('\nApplying schema...');

            const schema = fs.readFileSync('schema.sql', 'utf8');
            await sql(schema);

            console.log('✓ Schema applied successfully');
        } else {
            console.log('✓ employees table exists');
        }

        console.log('\nChecking table structure...');
        const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'employees'
      ORDER BY ordinal_position
    `;
        console.log('Columns:', columns);

    } catch (error) {
        console.error('✗ Database error:', error);
        process.exit(1);
    }
}

testDatabase();
