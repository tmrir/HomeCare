import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';

// Load environment variables
dotenv.config();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// SQL queries to execute
const SQL_QUERIES = [
  `-- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;`,
  
  `-- Drop table if exists (be careful with this in production)
  DROP TABLE IF EXISTS public.profiles CASCADE;`,
  
  `-- Create profiles table
  CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id)
  );`,
  
  `-- Enable RLS
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`,
  
  `-- Create policies
  CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles
    FOR SELECT
    USING (true);`,
  
  `CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);`,
  
  `-- Create function to handle new user signups
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'full_name',
      COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;`,
  
  `-- Create trigger for new user signups
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`
];

async function runQueries() {
  console.log('🚀 Starting database setup...\n');
  
  try {
    // Execute each query one by one
    for (let i = 0; i < SQL_QUERIES.length; i++) {
      const query = SQL_QUERIES[i];
      console.log(`🔍 Executing query ${i + 1}/${SQL_QUERIES.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { query });
      
      if (error) {
        // If the function doesn't exist, try direct query
        if (error.message.includes('function exec_sql(unknown) does not exist')) {
          console.log('ℹ️ exec_sql function not found, trying direct query...');
          const { error: queryError } = await supabase.rpc('pg_temp.exec_sql', { query });
          
          if (queryError) {
            console.error(`❌ Error in query ${i + 1}:`, queryError.message);
            console.log('Query was:', query);
            throw queryError;
          }
        } else {
          console.error(`❌ Error in query ${i + 1}:`, error.message);
          console.log('Query was:', query);
          throw error;
        }
      }
      
      console.log(`✅ Query ${i + 1} executed successfully`);
    }
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nYou can now run the admin creation script:');
    console.log('node scripts/create-admin.js');
    
  } catch (error) {
    console.error('\n❌ Database setup failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run the setup
runQueries();
