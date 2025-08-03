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
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkTables() {
  try {
    console.log('🔍 جاري فحص جداول قاعدة البيانات...\n');
    
    // جلب قائمة الجداول في قاعدة البيانات
    const { data: tables, error } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');

    if (error) {
      console.error('❌ خطأ في جلب قائمة الجداول:', error.message);
      throw error;
    }

    if (!tables || tables.length === 0) {
      console.log('⚠️ لا توجد جداول في قاعدة البيانات');
    } else {
      console.log('📋 الجداول الموجودة في قاعدة البيانات:');
      console.log('='.repeat(40));
      tables.forEach((table, index) => {
        console.log(`${index + 1}. ${table.tablename}`);
      });
      console.log('\n✅ العدد الإجمالي للجداول:', tables.length);
    }

  } catch (error) {
    console.error('\n❌ حدث خطأ غير متوقع:');
    console.error(error);
  } finally {
    process.exit(0);
  }
}

// تشغيل السكريبت
checkTables();
