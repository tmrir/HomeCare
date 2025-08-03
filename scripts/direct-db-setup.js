import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupDatabase() {
  console.log('🚀 Starting database setup...');
  
  try {
    // 1. Create profiles table
    console.log('\n🔨 Creating profiles table...');
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID REFERENCES auth.users ON DELETE CASCADE,
          email TEXT NOT NULL,
          full_name TEXT,
          role TEXT NOT NULL DEFAULT 'user',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          PRIMARY KEY (id)
        );
      `,
    });

    if (createTableError) throw createTableError;
    console.log('✅ Created profiles table');

    // 2. Enable RLS
    console.log('\n🔒 Enabling Row Level Security...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      query: 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;',
    });

    if (rlsError) console.log('ℹ️ RLS might already be enabled');
    else console.log('✅ Enabled Row Level Security');

    // 3. Create select policy
    console.log('\n📝 Creating select policy...');
    const { error: selectPolicyError } = await supabase.rpc('exec_sql', {
      query: `
        DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
        CREATE POLICY "Public profiles are viewable by everyone"
          ON public.profiles
          FOR SELECT
          USING (true);
      `,
    });

    if (selectPolicyError) throw selectPolicyError;
    console.log('✅ Created select policy');

    // 4. Create update policy
    console.log('\n📝 Creating update policy...');
    const { error: updatePolicyError } = await supabase.rpc('exec_sql', {
      query: `
        DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
        CREATE POLICY "Users can update their own profile"
          ON public.profiles
          FOR UPDATE
          USING (auth.uid() = id);
      `,
    });

    if (updatePolicyError) throw updatePolicyError;
    console.log('✅ Created update policy');

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nYou can now run the admin creation script:');
    console.log('node scripts/create-admin.js');
    
  } catch (error) {
    console.error('\n❌ Error setting up database:');
    console.error(error);
    
    if (error.message.includes('permission denied')) {
      console.error('\n🔑 Error: Permission denied. Make sure you are using the service role key (SUPABASE_SERVICE_ROLE_KEY)');
      console.error('and that the key has the necessary permissions to create tables and policies.');
    }
    
    process.exit(1);
  }
}

// Run the setup
setupDatabase();
