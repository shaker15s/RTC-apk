# مراجعة مخرجات AI Studio مقابل تصميم Masar RTC الأصلي

**تاريخ المراجعة:** 2026-08-14
**الريبو الحالي:** `shaker15s/RTC-apk` عند خط أساس `240b2fc`
**المرجع المقارن:** `shaker15s/RTC-app`، فرع `main` عند `3eb5c92` (PR #6)

## الخلاصة

الريبو الجديد لا يحتوي إعادة تصميم React/Flutter/Compose عاملة وقت التشغيل. أغلب واجهة Masar RTC الأصلية نُقلت بالفعل كما هي. لذلك تم الحفاظ على الواجهة العربية RTL والهوية والألوان والبطاقات والخطوط وترتيب الشاشات، واقتصرت التعديلات على إصلاحات وظيفية، وصولية، PWA وNative لا تغيّر التصميم.

## ملفات التصميم التي اعتُمدت كمصدر حقيقة

- `index.html`
- `styles/app.css` و`css/app.css`
- `app.js`
- `js/ui.js`
- `js/content.js`
- `js/i18n.js`
- `js/native.js`
- `js/security.js`
- `assets/` و`assets/vendor/`
- `manifest.json`
- `sw.js`
- `privacy.html`
- `terms.html`
- `verify.html`

قبل إصلاحات هذه المراجعة، كانت الملفات المشتركة `index.html` و`js/ui.js` و`js/content.js` و`js/i18n.js` و`js/security.js` والصفحات القانونية مطابقة للمرجع. لم يُستبدل أي منها بقالب Material أو UI مولّد.

## منطق مفيد تم الاحتفاظ به وتحسينه

1. **تحسينات الشاشات الصغيرة وSafe Areas** في `styles/app.css`: تدعم 320–360px، حواف iPhone الآمنة، وأهداف لمس أوضح دون تغيير لوحة الألوان أو مكونات التصميم.
2. **طابور إعادة المحاولة عند انقطاع الشبكة** في `js/api.js` مع وصلات الاستئناف في `app.js` و`js/native.js`. تم تصليبه بحيث:
   - ترتبط كل عملية بصاحب جلسة Supabase نفسه.
   - لا تُنفذ عملية مستخدم تحت حساب مستخدم آخر على الجهاز.
   - تُستبعد عمليات الإدخال غير idempotent مثل الأعذار والبث والملاحظات الخاصة لمنع التكرار بعد استجابة شبكة مبهمة.
   - تُرفض عناصر الطابور القديمة غير المنسوبة أو غير المسموح بها.
   - يُمسح الطابور عند تسجيل الخروج لحماية الأجهزة المشتركة.
3. **تحسينات Native غير بصرية** مثل ملفات Gradle المساعدة و`colors.xml`؛ بقي مشروع Android القياسي داخل `android/` هو المصدر الأساسي للبناء.
4. **تحديثات lockfile** أبقيت لأنها لا تدخل مكتبات UI جديدة، مع إعادة توليد Vendor محليًا من `npm ci` بدل CDN.

## عناصر غير متوافقة أو زائدة

- حُذف `metadata.json` لأنه أثر خاص بـAI Studio ويعلن `SERVER_SIDE_GEMINI_API` رغم عدم وجود ميزة Gemini في التطبيق، ولا علاقة له ببناء Masar RTC.
- لم يُنقل أو يُنشأ أي Material UI أو Material Symbols runtime أو Flutter أو Jetpack Compose UI.
- لم تُستخدم أي خطوط أو أيقونات أو JavaScript عبر Runtime CDN.

## أعطال اكتُشفت في نقل الريبو الجديد

كانت ملفات مرجعية لازمة مفقودة رغم أن manifests/build يشير إليها، وهو ما كان سيعطل تثبيت Service Worker ويترك Asset Catalog في iOS ناقصًا:

- أيقونات PWA ذات حجم 192 وmaskable.
- Android base splash وأيقونات round القديمة لكل densities.
- iOS App Icon 180/1024 وصور Splash المشار إليها.
- أصول المتاجر 512/1024.

أُعيدت هذه الملفات حرفيًا من مستودع Masar RTC المرجعي، دون توليد هوية بصرية جديدة. كما أصبح build يفشل صراحةً إذا غاب أي ملف داخل `APP_SHELL` بدل إصدار bundle ناقص بصمت.

## ثوابت الهوية والتكامل التي تم التحقق منها

- اسم التطبيق: **Masar RTC / مسار RTC**.
- App ID: `org.resala.rtc.masar` في Capacitor وAndroid وiOS.
- OAuth callback: `org.resala.rtc.masar://auth`.
- رابط RTC الرسمي: `https://rtc-kohl.vercel.app/`.
- Supabase هو نظام الهوية والبيانات؛ لا يوجد Firebase Auth أو Firestore.
- Firebase Android محصور في Analytics/FCM وإعداد العميل غير متعقب في Git.

## Supabase leaderboard

الملف `supabase/migrations/20260814100000_repair_leaderboard_and_rtc_link.sql` موجود ومطابق للغرض المطلوب: ينشئ `public.get_leaderboard()` بلا معاملات، يعيد `id, full_name, points, avatar_url, rank`، يمنع `PUBLIC` ويمنح `authenticated`، ثم يطلب إعادة تحميل PostgREST schema.

وجود الملف في Git **لا يثبت تطبيقه على قاعدة البيانات الحية**. أثناء المراجعة لم يوجد Supabase CLI مرتبط ولا صلاحية إدارية موثقة، ولذلك لم تُنفذ migration على المشروع الحي ولم يُدّعَ ذلك.
