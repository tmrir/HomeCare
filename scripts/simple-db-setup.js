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

async function runQuery(query) {
  console.log('\n🔍 Executing query...');
  console.log(query);
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query });
    
    if (error) {
      console.error('❌ Error executing query:', error.message);
      return false;
    }
    
    console.log('✅ Query executed successfully');
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function setupDatabase() {
  console.log('🚀 Starting database setup...');
  
  // 1. Create profiles table
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS public.profiles (
      id UUID REFERENCES auth.users ON DELETE CASCADE,
      email TEXT NOT NULL,
      full_name TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (id)
    );
  `;
  
  if (!(await runQuery(createTableQuery))) {
    console.error('❌ Failed to create profiles table');
    return;
  }
  
  // 2. Enable RLS
  const enableRlsQuery = `
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  `;
  
  if (!(await runQuery(enableRlsQuery))) {
    console.error('❌ Failed to enable RLS');
    return;
  }
  
  // 3. Create select policy
  const selectPolicyQuery = `
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
    CREATE POLICY "Public profiles are viewable by everyone"
      ON public.profiles
      FOR SELECT
      USING (true);
  `;
  
  if (!(await runQuery(selectPolicyQuery))) {
    console.error('❌ Failed to create select policy');
    return;
  }
  
  // 4. Create update policy
  const updatePolicyQuery = `
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
    CREATE POLICY "Users can update their own profile"
      ON public.profiles
      FOR UPDATE
      USING (auth.uid() = id);
  `;
  
  if (!(await runQuery(updatePolicyQuery))) {
    console.error('❌ Failed to create update policy');
    return;
  }
  
  console.log('\n🎉 Database setup completed successfully!');
  console.log('\nYou can now run the admin creation script:');
  console.log('node scripts/create-admin.js');
}

// Run the setup
setupDatabase();
