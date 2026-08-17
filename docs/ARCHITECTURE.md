# Masar RTC Native Mobile — وثيقة البنية المعمارية (Architecture & Engineering Spec)

**التطبيق:** مسار RTC — منصة مراكز رسالة للتدريب (Resala Training Centers)  
**معرف التطبيق (App ID):** `org.resala.rtc.masar`  
**مخطط الروابط العميقة (Deep Link Scheme):** `org.resala.rtc.masar://auth`  
**الإصدار:** `2.0.0` (Build 20000)  
**التقنية:** React Native + Expo SDK 54 + TypeScript + Zustand + Supabase JS + NetInfo  

---

## 1. فلسفة المعمارية والتصميم

1. **100% Native Mobile Architecture:**
   - تم بناء التطبيق بالكامل باستخدام واجهات نيتف نقية (Native UI Components) دون أي استخدام لـ WebViews أو تضمين كود الموقع الأصلي داخل أغلفة ميتة.
   - يدعم التمرير السلس 60/120 FPS عبر محركات التصيير الأصلية على iOS وAndroid.

2. **عمارة الطبقات النظيفة (Clean Layered Architecture):**
   ```
   rtc_mobile/
   ├── src/
   │   ├── core/           # الثوابت، الثيم، الترجمة، التخزين المشفر، الهابتيكس، الإشعارات
   │   ├── data/           # عميل Supabase، 26 استدعاء RPC، مستودعات REST والتخزين
   │   ├── state/          # متاجر Zustand (جلسة المستخدم والثيم واللغة والشبكة)
   │   ├── components/     # المكونات المشتركة والأزرار والكروت والهيدر الزجاجي والماسح
   │   ├── screens/        # الشاشات الـ 30 موزعة (public, student, volunteer, admin)
   │   └── navigation/     # الملاح الرئيسي، حراس المسارات (Route Guards)، شريط التبويب
   ├── tests/              # جناح الاختبارات الآلية ومطابقة العقود
   └── docs/               # مصفوفة التطابق ووثائق التشغيل
   ```

3. **الأمان وحماية البيانات (Security & PII Rules):**
   - **العميل غير موثوق به (Zero Trust Client):** لا يحتوي العميل على أي مفتاح `service_role`؛ جميع العمليات الحساسة وتعديل الصلاحيات ومنح النقاط تتم حصرياً عبر دوال `SECURITY DEFINER` في PostgreSQL.
   - **التخزين المشفر:** حفظ التوكن والجلسة عبر `expo-secure-store` باستخدام Keychain في iOS و Keystore في Android مع عزل تام.
   - **حراس المسارات (Route Guards):** فحص صلاحية الوصول لكل شاشة بحسب دور المستخدم المسجل (`student` | `volunteer` | `admin`) قبل عرض المكون.

---

## 2. الميزات النيتفية الثمانية (8 Native Features)

1. **ماسح الـ QR بكاميرا الهاتف (Native Camera QR Scanner):**
   - ماسح كود فوري مدمج باستخدام `expo-camera` يقرأ رموز الحضور والشهادات ويفعل تسجيل الحضور بثانية واحدة.
2. **الاستجابة اللمسية الفائقة (Haptic Feedback):**
   - تفاعل لمسي نيتف عبر `expo-haptics` عند النقرات (Impact Light)، نجاح العمليات (Notification Success)، والأخطاء (Notification Error).
3. **التخزين المشفر (Encrypted Storage):**
   - تشفير بيانات الجلسة والمفاتيح المحلية عبر Keystore/Keychain.
4. **تنبيهات وتذكيرات المحاضرات (Local Scheduled Notifications):**
   - جدولة تذكيرات محلية قبل بدء المحاضرات بساعة وقنوات إشعارات مخصصة.
5. **مشاركة النظام الأصلية (Native Share Sheet):**
   - مشاركة الشهادات المعتمدة، وروابط التحقق، ورابط التطبيق عبر نافذة المشاركة الرسمية في أندرويد وiOS.
6. **مراقبة الشبكة والعمل دون اتصال (Offline Banner & Network Listener):**
   - شريط علوي تفاعلي ينبه المستخدم فور انقطاع الاتصال مع كاش للبيانات عبر TanStack Query.
7. **الروابط العميقة (Deep Linking & Universal Links):**
   - معالجة الروابط `org.resala.rtc.masar://auth` وروابط التحقق المباشر من الشهادات.
8. **الوضع الليلي الاحترافي (OLED Dark Mode):**
   - ثيم أسود نيتف مخصص لشاشات OLED مع تباين عالي وتوفير لاستهلاك البطارية.

---

## 3. التكامل مع Supabase و 26 دالة RPC

- تم ربط التطبيق بقاعدة البيانات المركزية لـ RTC مع مطابقة تامة لجدول الدوال الـ 26 الموثقة في `docs/RPC-CONTRACT.md`.
- دعم رفع الملفات والصور إلى باكت `avatars` (الأفاتار العام) وباكت `excuses` (مستندات الأعذار الطبية).
