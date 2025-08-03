import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// تحميل متغيرات البيئة
dotenv.config();

console.log('🔍 اختبار اتصال Supabase...');
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ موجود' : '❌ مفقود');
console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ موجود' : '❌ مفقود');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\n❌ خطأ: يرجى التأكد من تعيين متغيرات البيئة المطلوبة في ملف .env');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function testConnection() {
  try {
    console.log('\n🔌 جاري اختبار الاتصال بـ Supabase...');
    
    // محاولة جلب إصدار قاعدة البيانات
    const { data, error } = await supabase.rpc('version');
    
    if (error) {
      console.log('ℹ️ لا يمكن الوصول إلى دالة version، جرب طريقة بديلة...');
      await testAlternativeConnection();
      return;
    }
    
    console.log('✅ تم الاتصال بنجاح!');
    console.log('إصدار قاعدة البيانات:', data);
    
  } catch (error) {
    console.error('\n❌ فشل الاتصال بـ Supabase:');
    console.error(error);
    await testAlternativeConnection();
  }
}

async function testAlternativeConnection() {
  try {
    console.log('\n🔄 جرب طريقة اتصال بديلة...');
    const { data, error } = await supabase.from('_tables').select('*').limit(1);
    
    if (error) throw error;
    
    console.log('✅ تم الاتصال بنجاح (الطريقة البديلة)');
    console.log('البيانات المسترجعة:', data);
    
  } catch (error) {
    console.error('\n❌ فشل الاتصال بالطريقة البديلة:');
    console.error('الرسالة:', error.message);
    console.error('\n🔧 خطوات استكشاف الأخطاء وإصلاحها:');
    console.log('1. تأكد من صحة عنوان URL ومفتاح الخدمة في ملف .env');
    console.log('2. تحقق من اتصال الإنترنت');
    console.log('3. تأكد من أن عنوان URL لـ Supabase صالح ويمكن الوصول إليه');
    console.log('4. تحقق من أن مفتاح الخدمة صالح وله الصلاحيات الكافية');
  } finally {
    process.exit(0);
  }
}

// تشغيل اختبار الاتصال
testConnection();
