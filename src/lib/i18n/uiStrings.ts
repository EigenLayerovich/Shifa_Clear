import type { SupportedLanguage } from '@/lib/clinical/types';

export interface LanguageMeta {
  code: SupportedLanguage;
  nativeLabel: string;
  englishLabel: string;
  dir: 'ltr' | 'rtl';
  speechLocale: string;
  fontClass: string;
}

export const LANGUAGES: LanguageMeta[] = [
  {
    code: 'en',
    nativeLabel: 'English',
    englishLabel: 'English',
    dir: 'ltr',
    speechLocale: 'en-US',
    fontClass: 'font-sans',
  },
  {
    code: 'ar',
    nativeLabel: 'العربية',
    englishLabel: 'Arabic',
    dir: 'rtl',
    speechLocale: 'ar-AE',
    fontClass: 'font-arabic',
  },
  {
    code: 'ur',
    nativeLabel: 'اردو',
    englishLabel: 'Urdu',
    dir: 'rtl',
    speechLocale: 'ur-PK',
    fontClass: 'font-arabic',
  },
  {
    code: 'tl',
    nativeLabel: 'Tagalog',
    englishLabel: 'Tagalog',
    dir: 'ltr',
    speechLocale: 'fil-PH',
    fontClass: 'font-sans',
  },
  {
    code: 'hi',
    nativeLabel: 'हिन्दी',
    englishLabel: 'Hindi',
    dir: 'ltr',
    speechLocale: 'hi-IN',
    fontClass: 'font-devanagari',
  },
];

export const LANGUAGE_MAP: Record<SupportedLanguage, LanguageMeta> = {
  en: LANGUAGES[0],
  ar: LANGUAGES[1],
  ur: LANGUAGES[2],
  tl: LANGUAGES[3],
  hi: LANGUAGES[4],
};

export interface UIStrings {
  tagline: string;
  subtitle: string;
  skipToMain: string;
  elderMode: string;
  elderModeHint: string;
  unitsLabel: string;
  auditTrailBtn: string;
  qrSettingsBtn: string;
  uploadTab: string;
  pasteTab: string;
  dropzoneTitle: string;
  dropzoneSubtitle: string;
  chooseFileBtn: string;
  pastePlaceholder: string;
  analyzeBtn: string;
  analyzingBtn: string;
  patientContextTitle: string;
  ageLabel: string;
  sexLabel: string;
  male: string;
  female: string;
  demoCasesHeading: string;
  demoCasesSub: string;
  openCaseBtn: string;
  newScanBtn: string;
  urgentBannerCall: string;
  safetyAlertsHeading: string;
  biomarkersHeading: string;
  medicationsHeading: string;
  allFilter: string;
  abnormalFilter: string;
  referenceLabel: string;
  convertedFromLabel: string;
  priorLabel: string;
  morningSlot: string;
  afternoonSlot: string;
  eveningSlot: string;
  bedtimeSlot: string;
  doctorPrepHeading: string;
  doctorPrepSub: string;
  copyWhatsappBtn: string;
  copiedWhatsappBtn: string;
  printBtn: string;
  listenBtn: string;
  stopAudioBtn: string;
  generatingAudioBtn: string;
  disclaimerTitle: string;
  disclaimerText: string;
  statusLabels: Record<string, string>;
  foodLabels: Record<string, string>;
  riskBadges: {
    routine: string;
    attention: string;
    urgent: string;
  };
}

export const UI_STRINGS: Record<SupportedLanguage, UIStrings> = {
  en: {
    tagline: 'Multilingual Med & Lab Demystifier',
    subtitle: 'AI extracts & translates • Physician-validated clinical guardrails verify every threshold',
    skipToMain: 'Skip to main content',
    elderMode: 'Elder Mode',
    elderModeHint: 'Large text & icon pill schedule',
    unitsLabel: 'Units',
    auditTrailBtn: 'Clinical Audit',
    qrSettingsBtn: 'QR & API',
    uploadTab: 'Scan Photo / PDF',
    pasteTab: 'Paste Clinical Text',
    dropzoneTitle: 'Drop a lab report, PDF, or medication box photo',
    dropzoneSubtitle: 'Supports JPG, PNG, WebP, or PDF (up to 10 MB) — analyzed via Gemini 3.8 Flash + deterministic MD rules',
    chooseFileBtn: 'Upload or Take Photo',
    pastePlaceholder: 'Paste lab values or prescription text (e.g., "HbA1c 7.4%, Fasting Glucose 142 mg/dL, Cozaar 50mg OD, Lasix 40mg OD, Voltaren 50mg BD")...',
    analyzeBtn: 'Analyze Safely',
    analyzingBtn: 'Running Clinical Verification...',
    patientContextTitle: 'Patient Context (Sex & Age-Specific Ranges)',
    ageLabel: 'Age',
    sexLabel: 'Sex',
    male: 'Male',
    female: 'Female',
    demoCasesHeading: 'UAE Flagship Clinical Cases (Instant Demo)',
    demoCasesSub: 'Runs live through our deterministic clinical safety engine — zero risk of stage failure',
    openCaseBtn: 'Inspect Case',
    newScanBtn: 'New Scan',
    urgentBannerCall: 'Call 998 (UAE National Ambulance) or visit Emergency',
    safetyAlertsHeading: 'Deterministic Clinical Safety Alerts',
    biomarkersHeading: 'Lab Biomarker Breakdown',
    medicationsHeading: 'Daily Medication Timetable',
    allFilter: 'All Markers',
    abnormalFilter: 'Needs Attention',
    referenceLabel: 'Target Range',
    convertedFromLabel: 'Auto-converted from',
    priorLabel: '6 months ago',
    morningSlot: 'Morning',
    afternoonSlot: 'Afternoon',
    eveningSlot: 'Evening',
    bedtimeSlot: 'Bedtime',
    doctorPrepHeading: 'Doctor Visit Prep & Caregiver Handoff',
    doctorPrepSub: 'Smart clinical questions to bring to your SEHA, Cleveland Clinic, or Burjeel follow-up',
    copyWhatsappBtn: 'Copy WhatsApp Caregiver Card',
    copiedWhatsappBtn: 'Copied for WhatsApp!',
    printBtn: 'Print Summary',
    listenBtn: 'Listen in English',
    stopAudioBtn: 'Stop Audio',
    generatingAudioBtn: 'Preparing Voice...',
    disclaimerTitle: 'Clinical Safety Boundary',
    disclaimerText: 'ShifaClear explains lab results and prepares questions for your doctor — it does not diagnose medical conditions or change prescribed treatments.',
    statusLabels: {
      critical_low: 'Critical Low',
      low: 'Low',
      borderline_low: 'Borderline Low',
      normal: 'Normal',
      borderline_high: 'Borderline High',
      high: 'High',
      critical_high: 'Critical High',
      unknown: 'Review with Doctor',
    },
    foodLabels: {
      empty_stomach_separate: 'Empty stomach • Separate 4h from minerals',
      before_food: '30 min before meal',
      with_food: 'Take with meal',
      after_food: 'Take right after food',
      any: 'With or without food',
    },
    riskBadges: {
      routine: 'Routine Follow-Up',
      attention: 'Needs Doctor Review',
      urgent: 'Urgent Attention Required',
    },
  },
  ar: {
    tagline: 'مبسّط التحاليل والوصفات الطبية متعدد اللغات',
    subtitle: 'الذكاء الاصطناعي يستخرج ويترجم • وقواعد طبية دقيقة تتحقق من كل قيمة وتداخل دوائي',
    skipToMain: 'انتقل إلى المحتوى الرئيسي',
    elderMode: 'وضع كبار السن',
    elderModeHint: 'خط كبير وجدول أدوية بالرموز',
    unitsLabel: 'الوحدات',
    auditTrailBtn: 'التدقيق السريري',
    qrSettingsBtn: 'QR والإعدادات',
    uploadTab: 'تصوير / رفع ملف PDF',
    pasteTab: 'لصق نص التحليل أو الوصفة',
    dropzoneTitle: 'اسحب صورة التحليل المخبري أو الوصفة الطبية أو علبة الدواء هنا',
    dropzoneSubtitle: 'يدعم JPG و PNG و PDF — تحليل فوري عبر Gemini 3.8 Flash مع التحقق الطبي الحتمي',
    chooseFileBtn: 'اختر ملفاً أو التقط صورة',
    pastePlaceholder: 'الصق نتائج التحاليل أو أسماء الأدوية هنا...',
    analyzeBtn: 'تحليل آمن الآن',
    analyzingBtn: 'جاري التحقق السريري...',
    patientContextTitle: 'بيانات المريض (لتحديد النطاقات الطبيعية حسب العمر والجنس)',
    ageLabel: 'العمر',
    sexLabel: 'الجنس',
    male: 'ذكر',
    female: 'أنثى',
    demoCasesHeading: 'حالات سريرية نموذجية من الإمارات (عرض فوري)',
    demoCasesSub: 'تعمل مباشرة عبر محرك السلامة السريرية الحتمي للتحقق من الوحدات والتداخلات',
    openCaseBtn: 'عرض الحالة',
    newScanBtn: 'فحص جديد',
    urgentBannerCall: 'اتصل بالإسعاف الوطني 998 أو توجه للطوارئ فوراً',
    safetyAlertsHeading: 'تنبيهات السلامة السريرية المؤكدة',
    biomarkersHeading: 'تحليل المؤشرات المخبرية',
    medicationsHeading: 'جدول الأدوية اليومي',
    allFilter: 'جميع المؤشرات',
    abnormalFilter: 'تحتاج متابعة',
    referenceLabel: 'النطاق الطبيعي',
    convertedFromLabel: 'تم التحويل تلقائياً من',
    priorLabel: 'قبل 6 أشهر',
    morningSlot: 'الصباح',
    afternoonSlot: 'الظهيرة',
    eveningSlot: 'المساء',
    bedtimeSlot: 'قبل النوم',
    doctorPrepHeading: 'تجهيز زيارة الطبيب وملخص العائلة',
    doctorPrepSub: 'أسئلة طبية ذكية لموعدك القادم مع الطبيب وملخص جاهز لمشاركته مع الأسرة',
    copyWhatsappBtn: 'نسخ ملخص واتساب للعائلة',
    copiedWhatsappBtn: 'تم النسخ للواتساب!',
    printBtn: 'طباعة الملخص',
    listenBtn: 'استمع باللغة العربية',
    stopAudioBtn: 'إيقاف الصوت',
    generatingAudioBtn: 'جاري تجهيز الصوت...',
    disclaimerTitle: 'حدود السلامة الطبية',
    disclaimerText: 'يساعد شفاء كلير على فهم التحاليل وتجهيز أسئلة للطبيب — ولا يغني عن التشخيص الطبي أو تعديل الجرعات دون استشارة طبيبك.',
    statusLabels: {
      critical_low: 'منخفض بشكل حرج',
      low: 'منخفض',
      borderline_low: 'حدّي منخفض',
      normal: 'طبيعي',
      borderline_high: 'حدّي مرتفع',
      high: 'مرتفع',
      critical_high: 'مرتفع بشكل حرج',
      unknown: 'يُراجع مع الطبيب',
    },
    foodLabels: {
      empty_stomach_separate: 'على معدة فارغة • يُفصل 4 ساعات عن المعادن',
      before_food: 'قبل الأكل بـ 30 دقيقة',
      with_food: 'مع الوجبة',
      after_food: 'مباشرة بعد الأكل',
      any: 'مع أو بدون طعام',
    },
    riskBadges: {
      routine: 'متابعة روتينية',
      attention: 'يحتاج مراجعة الطبيب',
      urgent: 'يتطلب عناية عاجلة فوراً',
    },
  },
  ur: {
    tagline: 'کثیر لسانی میڈیکل رپورٹ اور نسخہ سمجھنے والا معاون',
    subtitle: 'AI پڑھتا اور ترجمہ کرتا ہے • طبی حفاظتی اصول ہر ویلیو اور دوا کی جانچ کرتے ہیں',
    skipToMain: 'مرکزی مواد پر جائیں',
    elderMode: 'بزرگ موڈ',
    elderModeHint: 'بڑا فونٹ اور آسان دواؤں کا شیڈول',
    unitsLabel: 'یونٹس',
    auditTrailBtn: 'کلینیکل آڈٹ',
    qrSettingsBtn: 'QR اور API',
    uploadTab: 'تصویر / PDF اپ لوڈ',
    pasteTab: 'رپورٹ متن پیسٹ کریں',
    dropzoneTitle: 'لیب رپورٹ، PDF یا دوا کے ڈبے کی تصویر یہاں ڈالیں',
    dropzoneSubtitle: 'JPG، PNG اور PDF سپورٹ — Gemini 3.8 Flash اور مستند طبی اصولوں کے ساتھ',
    chooseFileBtn: 'فائل منتخب کریں یا تصویر لیں',
    pastePlaceholder: 'لیب رزلٹ یا نسخے کا متن یہاں پیسٹ کریں...',
    analyzeBtn: 'محفوظ تجزیہ کریں',
    analyzingBtn: 'طبی جانچ جاری ہے...',
    patientContextTitle: 'مریض کی معلومات (عمر اور جنس کے مطابق نارمل رینج)',
    ageLabel: 'عمر',
    sexLabel: 'جنس',
    male: 'مرد',
    female: 'خاتون',
    demoCasesHeading: 'یو اے ای کے نمایاں کلینیکل کیسز (فوری ڈیمو)',
    demoCasesSub: 'ہمارے مستند طبی سیفٹی انجن کے ذریعے براہ راست چلتے ہیں',
    openCaseBtn: 'کیس دیکھیں',
    newScanBtn: 'نیا اسکین',
    urgentBannerCall: 'فوراً 998 (یو اے ای ایمبولینس) پر کال کریں یا ایمرجنسی جائیں',
    safetyAlertsHeading: 'مستند طبی حفاظتی انتباہات',
    biomarkersHeading: 'لیب ٹیسٹ کی تفصیل',
    medicationsHeading: 'روزانہ ادویات کا شیڈول',
    allFilter: 'تمام ٹیسٹ',
    abnormalFilter: 'توجہ طلب',
    referenceLabel: 'نارمل رینج',
    convertedFromLabel: 'خودکار تبدیلی از',
    priorLabel: '6 ماہ پہلے',
    morningSlot: 'صبح',
    afternoonSlot: 'دوپہر',
    eveningSlot: 'شام',
    bedtimeSlot: 'سونے سے پہلے',
    doctorPrepHeading: 'ڈاکٹر کے لیے سوالات اور فیملی خلاصہ',
    doctorPrepSub: 'اپنی اگلی ملاقات میں پوچھنے کے لیے اہم سوالات اور واٹس ایپ خلاصہ',
    copyWhatsappBtn: 'واٹس ایپ فیملی کارڈ کاپی کریں',
    copiedWhatsappBtn: 'کاپی ہو گیا!',
    printBtn: 'پرنٹ کریں',
    listenBtn: 'اردو میں سنیں',
    stopAudioBtn: 'آواز بند کریں',
    generatingAudioBtn: 'آواز تیار ہو رہی ہے...',
    disclaimerTitle: 'طبی احتیاطی دائرہ',
    disclaimerText: 'ShifaClear رپورٹس سمجھنے اور ڈاکٹر کے لیے سوالات تیار کرنے میں مدد دیتا ہے — یہ تشخیص یا دوا بدلنے کا متبادل نہیں۔',
    statusLabels: {
      critical_low: 'انتہائی کم (خطرناک)',
      low: 'کم',
      borderline_low: 'حد سے کچھ کم',
      normal: 'نارمل',
      borderline_high: 'حد سے کچھ زیادہ',
      high: 'زیادہ',
      critical_high: 'انتہائی زیادہ (خطرناک)',
      unknown: 'ڈاکٹر سے مشورہ کریں',
    },
    foodLabels: {
      empty_stomach_separate: 'خالی پیٹ • کیلشیم/آئرن سے 4 گھنٹے فاصلہ',
      before_food: 'کھانے سے 30 منٹ پہلے',
      with_food: 'کھانے کے ساتھ',
      after_food: 'کھانے کے فوراً بعد',
      any: 'کھانے کے ساتھ یا بغیر',
    },
    riskBadges: {
      routine: 'معمول کا فالو اپ',
      attention: 'ڈاکٹر کا معائنہ ضروری',
      urgent: 'فوری ایمرجنسی توجہ ضروری',
    },
  },
  tl: {
    tagline: 'Multilingual na Gabay sa Lab at Reseta',
    subtitle: 'AI ang nagbabasa at nagsasalin • Mga medikal na panuntunan ang nagbe-beripika sa bawat resulta',
    skipToMain: 'Lumaktaw sa pangunahing nilalaman',
    elderMode: 'Elder Mode',
    elderModeHint: 'Malaking letra at malinaw na iskedyul ng gamot',
    unitsLabel: 'Yunit',
    auditTrailBtn: 'Clinical Audit',
    qrSettingsBtn: 'QR at API',
    uploadTab: 'Mag-upload ng Larawan / PDF',
    pasteTab: 'I-paste ang Teksto',
    dropzoneTitle: 'Ilagay ang lab report, PDF, o larawan ng kahon ng gamot',
    dropzoneSubtitle: 'Tumatanggap ng JPG, PNG, PDF — sinusuri gamit ang Gemini 3.8 Flash + clinical safety rules',
    chooseFileBtn: 'Pumili ng File o Kumuha ng Larawan',
    pastePlaceholder: 'I-paste ang resulta ng lab o reseta dito...',
    analyzeBtn: 'Suriin nang Ligtas',
    analyzingBtn: 'Nagsasagawa ng Clinical Verification...',
    patientContextTitle: 'Impormasyon ng Pasyente (Para sa Tamang Normal Range)',
    ageLabel: 'Edad',
    sexLabel: 'Kasarian',
    male: 'Lalaki',
    female: 'Babae',
    demoCasesHeading: 'Mga Halimbawang Kaso sa UAE (Instant Demo)',
    demoCasesSub: 'Direktang dumadaan sa aming deterministic clinical safety engine',
    openCaseBtn: 'Buksan ang Kaso',
    newScanBtn: 'Bagong Scan',
    urgentBannerCall: 'Tumawag sa 998 (UAE Ambulance) o pumunta agad sa Emergency',
    safetyAlertsHeading: 'Mahahalagang Babalang Pangkalusugan',
    biomarkersHeading: 'Paliwanag ng mga Resulta sa Lab',
    medicationsHeading: 'Araw-araw na Iskedyul ng Gamot',
    allFilter: 'Lahat ng Marker',
    abnormalFilter: 'Kailangan ng Pansin',
    referenceLabel: 'Normal na Saklaw',
    convertedFromLabel: 'Awtomatikong na-convert mula sa',
    priorLabel: '6 na buwan ang nakalipas',
    morningSlot: 'Umaga',
    afternoonSlot: 'Tanghali',
    eveningSlot: 'Gabi',
    bedtimeSlot: 'Bago Matulog',
    doctorPrepHeading: 'Mga Tanong para sa Doktor at Buod para sa Pamilya',
    doctorPrepSub: 'Mahahalagang tanong na maaaring dalhin sa iyong susunod na check-up',
    copyWhatsappBtn: 'Kopyahin para sa WhatsApp',
    copiedWhatsappBtn: 'Nakopya para sa WhatsApp!',
    printBtn: 'I-print ang Buod',
    listenBtn: 'Pakinggan sa Tagalog',
    stopAudioBtn: 'Itigil ang Audio',
    generatingAudioBtn: 'Inihahanda ang Boses...',
    disclaimerTitle: 'Hangganan ng Kaligtasang Medikal',
    disclaimerText: 'Ipinaliliwanag ng ShifaClear ang mga resulta at naghahanda ng tanong para sa doktor — hindi ito nagbibigay ng diagnosis o nagbabago ng reseta.',
    statusLabels: {
      critical_low: 'Kritikal na Mababa',
      low: 'Mababa',
      borderline_low: 'Medyo Mababa',
      normal: 'Normal',
      borderline_high: 'Medyo Mataas',
      high: 'Mataas',
      critical_high: 'Kritikal na Mataas',
      unknown: 'Ipakita sa Doktor',
    },
    foodLabels: {
      empty_stomach_separate: 'Walang laman ang tiyan • Ihiwalay ng 4 oras sa calcium/iron',
      before_food: '30 min bago kumain',
      with_food: 'Kasabay ng pagkain',
      after_food: 'Pagkatapos kumain',
      any: 'May laman man o wala ang tiyan',
    },
    riskBadges: {
      routine: 'Regular na Follow-Up',
      attention: 'Kailangan ng Pagsusuri ng Doktor',
      urgent: 'Kailangan ng Agarang Atensyon',
    },
  },
  hi: {
    tagline: 'बहुभाषी लैब रिपोर्ट और दवा मार्गदर्शक',
    subtitle: 'AI पढ़ता और अनुवाद करता है • चिकित्सकीय नियम हर मान और दवा की सुरक्षा जांचते हैं',
    skipToMain: 'मुख्य सामग्री पर जाएं',
    elderMode: 'वरिष्ठ मोड',
    elderModeHint: 'बड़े अक्षर और आसान दवा समय-सारिणी',
    unitsLabel: 'इकाइयाँ',
    auditTrailBtn: 'क्लिनिकल ऑडिट',
    qrSettingsBtn: 'QR और API',
    uploadTab: 'फ़ोटो / PDF अपलोड करें',
    pasteTab: 'रिपोर्ट टेक्स्ट पेस्ट करें',
    dropzoneTitle: 'लैब रिपोर्ट, PDF या दवा के डिब्बे की फ़ोटो यहाँ डालें',
    dropzoneSubtitle: 'JPG, PNG, PDF समर्थित — Gemini 3.8 Flash + चिकित्सकीय सुरक्षा नियमों द्वारा जांच',
    chooseFileBtn: 'फ़ाइल चुनें या फ़ोटो लें',
    pastePlaceholder: 'लैब रिपोर्ट या प्रिस्क्रिप्शन का टेक्स्ट यहाँ पेस्ट करें...',
    analyzeBtn: 'सुरक्षित विश्लेषण करें',
    analyzingBtn: 'क्लिनिकल सत्यापन हो रहा है...',
    patientContextTitle: 'रोगी विवरण (उम्र और लिंग के अनुसार सामान्य सीमा)',
    ageLabel: 'उम्र',
    sexLabel: 'लिंग',
    male: 'पुरुष',
    female: 'महिला',
    demoCasesHeading: 'UAE प्रमुख क्लिनिकल केस (तुरंत डेमो)',
    demoCasesSub: 'हमारे सटीक चिकित्सकीय सुरक्षा इंजन पर लाइव चलता है',
    openCaseBtn: 'केस देखें',
    newScanBtn: 'नया स्कैन',
    urgentBannerCall: 'तुरंत 998 (UAE एम्बुलेंस) पर कॉल करें या इमरजेंसी जाएं',
    safetyAlertsHeading: 'चिकित्सकीय सुरक्षा चेतावनियाँ',
    biomarkersHeading: 'लैब बायोमार्कर विवरण',
    medicationsHeading: 'दैनिक दवा समय-सारिणी',
    allFilter: 'सभी मान',
    abnormalFilter: 'ध्यान देने योग्य',
    referenceLabel: 'सामान्य सीमा',
    convertedFromLabel: 'स्वतः परिवर्तित',
    priorLabel: '6 महीने पहले',
    morningSlot: 'सुबह',
    afternoonSlot: 'दोपहर',
    eveningSlot: 'शाम',
    bedtimeSlot: 'सोने से पहले',
    doctorPrepHeading: 'डॉक्टर के लिए प्रश्न और परिवार सारांश',
    doctorPrepSub: 'अपनी अगली डॉक्टर विज़िट के लिए स्मार्ट प्रश्न और व्हाट्सएप सारांश',
    copyWhatsappBtn: 'व्हाट्सएप सारांश कॉपी करें',
    copiedWhatsappBtn: 'व्हाट्सएप के लिए कॉपी हो गया!',
    printBtn: 'सारांश प्रिंट करें',
    listenBtn: 'हिन्दी में सुनें',
    stopAudioBtn: 'ऑडियो रोकें',
    generatingAudioBtn: 'आवाज़ तैयार हो रही है...',
    disclaimerTitle: 'चिकित्सकीय सुरक्षा सीमा',
    disclaimerText: 'ShifaClear रिपोर्ट को सरल भाषा में समझाता है और डॉक्टर के लिए प्रश्न तैयार करता है — यह निदान नहीं करता और न ही दवा बदलता है।',
    statusLabels: {
      critical_low: 'अत्यंत कम (आपात)',
      low: 'कम',
      borderline_low: 'सीमा पर कम',
      normal: 'सामान्य',
      borderline_high: 'सीमा पर अधिक',
      high: 'अधिक',
      critical_high: 'अत्यंत अधिक (आपात)',
      unknown: 'डॉक्टर को दिखाएं',
    },
    foodLabels: {
      empty_stomach_separate: 'खाली पेट • कैल्शियम/आयरन से 4 घंटे का अंतर',
      before_food: 'भोजन से 30 मिनट पहले',
      with_food: 'भोजन के साथ',
      after_food: 'भोजन के तुरंत बाद',
      any: 'भोजन के साथ या बिना',
    },
    riskBadges: {
      routine: 'सामान्य फॉलो-अप',
      attention: 'डॉक्टर की सलाह आवश्यक',
      urgent: 'तुरंत आपातकालीन ध्यान आवश्यक',
    },
  },
};
