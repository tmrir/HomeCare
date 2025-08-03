import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import process from 'node:process';

// Configure dotenv
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase URL or Service Role Key in environment variables');
  console.error('Please make sure to set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Create readline interface for user input
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Promisify readline question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Validate email format
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

async function createAdminUser() {
  try {
    console.log('=== إنشاء مستخدم مدير جديد ===');
    console.log('=============================\n');
    
    // Get user input with validation
    let email, password, fullName;
    
    while (true) {
      email = await question('أدخل البريد الإلكتروني: ');
      if (isValidEmail(email)) break;
      console.error('❌ خطأ: يرجى إدخال بريد إلكتروني صحيح');
    }
    
    while (true) {
      password = await question('أدخل كلمة المرور (8 أحرف على الأقل): ');
      if (password.length >= 8) break;
      console.error('❌ خطأ: يجب أن تكون كلمة المرور 8 أحرف على الأقل');
    }
    
    while (true) {
      fullName = await question('أدخل الاسم الكامل: ');
      if (fullName.trim() !== '') break;
      console.error('❌ خطأ: يرجى إدخال اسم صحيح');
    }

    console.log('\nجاري إنشاء حساب المدير...');

    try {
      // Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
        email: email.trim(),
        password: password.trim(),
        email_confirm: true, // Skip email confirmation
        user_metadata: {
          full_name: fullName.trim(),
          role: 'admin',
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          console.error('❌ خطأ: هذا البريد الإلكتروني مسجل مسبقاً');
        } else {
          console.error('❌ خطأ في إنشاء المستخدم:', signUpError.message);
        }
        throw signUpError;
      }

      const userId = authData.user.id;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: email.trim().toLowerCase(),
          full_name: fullName.trim(),
          role: 'admin',
        });

      if (profileError) {
        console.error('❌ خطأ في إنحة الملف الشخصي:', profileError.message);
        throw profileError;
      }

      console.log('\n✅ تم إنشاء حساب المدير بنجاح!');
      console.log(`📧 البريد الإلكتروني: ${email}`);
      console.log(`👤 الاسم: ${fullName}`);
      console.log('👑 الصلاحية: مدير النظام');
      console.log('\nيمكنك الآن تسجيل الدخول إلى لوحة التحكم:');
      console.log('🔗 رابط لوحة التحكم: http://localhost:8080/admin-dashboard');
      console.log('🔗 صفحة تسجيل الدخول: http://localhost:8080/login');
      
    } catch (error) {
      console.error('\n❌ فشل إنشاء المستخدم. الرجاء المحاولة مرة أخرى.');
      if (error.details) {
        console.error('تفاصيل الخطأ:', error.details);
      }
      throw error;
    }

  } catch (error) {
    console.error('Error creating admin user:');
    console.error(error);
  } finally {
    rl.close();
  }
}

// Run the script
createAdminUser()
  .then(() => {
    console.log('\n✅ Process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Unhandled error:', error);
    process.exit(1);
  });
