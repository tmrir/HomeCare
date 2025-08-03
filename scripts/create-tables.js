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

async function createTables() {
  try {
    console.log('🔄 Creating required tables...\n');

    // Create profiles table
    const { data: createTableData, error: createTableError } = await supabase.rpc('create_profiles_table');
    
    if (createTableError) {
      console.error('❌ Error creating tables:', createTableError.message);
      
      // If the function doesn't exist, create it using raw SQL
      console.log('ℹ️ Creating required SQL function...');
      
      const { error: functionError } = await supabase.rpc('create_profiles_table', {});
      
      if (functionError) {
        console.error('❌ Error creating SQL function:', functionError.message);
        // If RPC fails, try direct SQL execution
        console.log('ℹ️ Trying direct SQL execution...');
        await createTablesWithDirectSQL();
      }
    } else {
      console.log('✅ Tables created successfully!');
    }
    
  } catch (error) {
    console.error('\n❌ An unexpected error occurred:');
    console.error(error);
  } finally {
    process.exit(0);
  }
}

async function createTablesWithDirectSQL() {
  try {
    console.log('🔄 Creating tables using direct SQL...');
    
    // Create profiles table
    const { error: createTableError } = await supabase.from('sql').select('*').single();
    
    if (createTableError) {
      console.error('❌ Error executing direct SQL:', createTableError.message);
      console.log('\n📋 Please run the following SQL in your Supabase SQL editor:');
      console.log(`
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone." 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile." 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);
      `);
    }
    
  } catch (error) {
    console.error('❌ Error in direct SQL execution:', error);
  }
}

// Run the script
createTables();
