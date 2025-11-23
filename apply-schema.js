const { Pool } = require('@neondatabase/serverless');

const DATABASE_URL = 'postgresql://neondb_owner:npg_mO9YhTxpBKN3@ep-ancient-glitter-a4odixfp-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function applySchema() {
    const pool = new Pool({ connectionString: DATABASE_URL });
    const client = await pool.connect();

    try {
        console.log('✓ Connected to database');

        // Create employees table
        console.log('\nCreating employees table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) NOT NULL DEFAULT 'EMPLOYEE' CHECK (role IN ('EMPLOYEE', 'ADMIN')),
        password_hash VARCHAR(255) NOT NULL,
        department VARCHAR(100),
        designation VARCHAR(100),
        date_joined DATE NOT NULL DEFAULT CURRENT_DATE,
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✓ employees table created');

        // Create attendance table
        console.log('\nCreating attendance table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        clock_in TIMESTAMP,
        clock_out TIMESTAMP,
        total_hours DECIMAL(5,2),
        status VARCHAR(20) NOT NULL DEFAULT 'ABSENT' CHECK (status IN ('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'WFH')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id, date)
      )
    `);
        console.log('✓ attendance table created');

        // Create daily_reports table
        console.log('\nCreating daily_reports table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS daily_reports (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        tasks_summary TEXT NOT NULL,
        time_spent_hours DECIMAL(5,2),
        blockers TEXT,
        tomorrow_plan TEXT,
        project_client VARCHAR(255),
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id, date)
      )
    `);
        console.log('✓ daily_reports table created');

        // Create leaves table
        console.log('\nCreating leaves table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS leaves (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        from_date DATE NOT NULL,
        to_date DATE NOT NULL,
        leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('SICK', 'CASUAL', 'EARNED', 'UNPAID')),
        reason TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✓ leaves table created');

        // Create indexes
        console.log('\nCreating indexes...');
        await client.query('CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_daily_reports_employee_date ON daily_reports(employee_id, date)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_leaves_employee ON leaves(employee_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email)');
        console.log('✓ indexes created');

        // Insert admin user
        console.log('\nInserting admin user...');
        await client.query(`
      INSERT INTO employees (name, email, phone, role, password_hash, department, designation, status)
      VALUES (
        'Admin User',
        'admin@company.com',
        '1234567890',
        'ADMIN',
        '$2a$10$rXKZ5qJ5qJ5qJ5qJ5qJ5qOZvYxKZ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5q',
        'Management',
        'System Administrator',
        'ACTIVE'
      ) ON CONFLICT (email) DO NOTHING
    `);
        console.log('✓ admin user inserted');

        // Verify tables
        console.log('\nVerifying tables...');
        const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
        console.log('Tables:', result.rows.map(r => r.table_name));

        console.log('\n✅ Schema applied successfully!');

    } catch (error) {
        console.error('✗ Error:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

applySchema().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
