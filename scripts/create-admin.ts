import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';
import { promisify } from 'util';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase URL or Service Role Key in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Promisify readline question
const question = promisify(rl.question).bind(rl);

async function createAdminUser() {
  try {
    console.log('=== Create Admin User ===');
    
    // Get user input
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password (min 8 characters): ');
    const fullName = await question('Enter full name: ');

    if (!email || !password || !fullName) {
      console.error('Error: All fields are required');
      rl.close();
      return;
    }

    if (password.length < 8) {
      console.error('Error: Password must be at least 8 characters long');
      rl.close();
      return;
    }

    console.log('\nCreating admin user...');

    // Create auth user
    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        full_name: fullName,
        role: 'admin',
      },
    });

    if (signUpError) throw signUpError;

    const userId = authData.user.id;

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email,
        full_name: fullName,
        role: 'admin',
      });

    if (profileError) throw profileError;

    console.log('\n✅ Admin user created successfully!');
    console.log(`Email: ${email}`);
    console.log('Role: admin');
    console.log('\nYou can now log in to the admin dashboard.');
    console.log('Admin Dashboard URL: http://localhost:8080/admin-dashboard');
    console.log('Login URL: http://localhost:8080/login');

  } catch (error) {
    console.error('Error creating admin user:');
    console.error(error);
  } finally {
    rl.close();
  }
}

// Run the script
createAdminUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
