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

async function createTable() {
  try {
    console.log('🔄 Creating profiles table...');
    
    // Create the profiles table
    const { data: createTableData, error: createTableError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    // If the table doesn't exist, this will throw an error
    if (createTableError) {
      console.log('ℹ️ Profiles table does not exist, creating it now...');
      
      // Execute raw SQL to create the table
      const { error: sqlError } = await supabase
        .rpc('pg_temp.create_profiles_table');
      
      if (sqlError) {
        console.error('❌ Error creating profiles table:', sqlError.message);
        console.log('\nPlease run the following SQL in your Supabase SQL Editor:');
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
  ON public.profiles 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile." 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);
        `);
        process.exit(1);
      }
      
      console.log('✅ Profiles table created successfully!');
    } else {
      console.log('✅ Profiles table already exists');
    }
    
    // Verify the table was created
    const { data: profiles, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.error('❌ Error verifying profiles table:', selectError.message);
      process.exit(1);
    }
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nYou can now run the admin creation script:');
    console.log('node scripts/create-admin.js');
    
  } catch (error) {
    console.error('\n❌ Error setting up database:');
    console.error(error);
    process.exit(1);
  }
}

// Run the setup
createTable();
