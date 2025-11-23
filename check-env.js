require('dotenv').config({ path: '.env.local' });

console.log('Environment variables check:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓ Set' : '✗ Not set');
console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL ? '✓ Set' : '✗ Not set');

if (process.env.DATABASE_URL) {
    console.log('\nDATABASE_URL value:', process.env.DATABASE_URL.substring(0, 50) + '...');
}

if (process.env.JWT_SECRET) {
    console.log('JWT_SECRET value:', process.env.JWT_SECRET);
}
