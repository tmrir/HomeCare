import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// تحميل متغيرات البيئة
dotenv.config();

// تهيئة عميل Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ خطأ: لم يتم تعيين متغيرات البيئة المطلوبة');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function listUsers() {
  try {
    console.log('جاري جلب قائمة المستخدمين...\n');
    
    // جلب بيانات المستخدمين من جدول auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ خطأ في جلب مستخدمي المصادقة:', authError.message);
      throw authError;
    }

    // جلب بيانات الملفات الشخصية
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*');

    if (profileError) {
      console.error('❌ خطأ في جلب الملفات الشخصية:', profileError.message);
      throw profileError;
    }

    console.log('📋 المستخدمون المسجلون في النظام:');
    console.log('='.repeat(60));
    
    authUsers.users.forEach(user => {
      const profile = profiles?.find(p => p.id === user.id) || {};
      console.log(`
👤 المعرف: ${user.id}`);
      console.log(`📧 البريد الإلكتروني: ${user.email}`);
      console.log(`👤 الاسم: ${profile?.full_name || 'غير محدد'}`);
      console.log(`👑 الصلاحية: ${profile?.role || 'غير محدد'}`);
      console.log(`✅ الحساب مفعل: ${user.email_confirmed_at ? 'نعم' : 'لا'}`);
      console.log(`📅 تاريخ الإنشاء: ${new Date(user.created_at).toLocaleString()}`);
      console.log('─'.repeat(60));
    });

    console.log(`\n✅ العدد الإجمالي للمستخدمين: ${authUsers.users.length}`);
    
  } catch (error) {
    console.error('\n❌ حدث خطأ غير متوقع:');
    console.error(error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// تشغيل السكريبت
listUsers();
