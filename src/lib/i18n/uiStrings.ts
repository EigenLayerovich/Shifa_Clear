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
  statMarkers: string;
  statAttention: string;
  statAlerts: string;
  statMeds: string;
  voiceHandoffHeading: string;
  hideNote: string;
  showNote: string;
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
    tagline: 'Understand UAE lab reports and prescriptions in five languages',
    subtitle:
      'Extracts biomarkers and pharmacy brands, verifies every threshold against age- and sex-specific rules, and translates the findings into plain language for patients and caregivers.',
    skipToMain: 'Skip to main content',
    elderMode: 'Large print',
    unitsLabel: 'Units',
    auditTrailBtn: 'Audit trail',
    qrSettingsBtn: 'QR & API',
    uploadTab: 'Photo or PDF',
    pasteTab: 'Paste text',
    dropzoneTitle: 'Drop a lab sheet, PDF, or medication box photo',
    dropzoneSubtitle: 'JPG, PNG, WebP, or PDF up to 10 MB',
    chooseFileBtn: 'Select file',
    pastePlaceholder: 'Paste lab values or prescription text',
    analyzeBtn: 'Verify and explain',
    analyzingBtn: 'Running clinical verification',
    patientContextTitle: 'Reference range context',
    ageLabel: 'Age',
    sexLabel: 'Sex',
    male: 'Male',
    female: 'Female',
    demoCasesHeading: 'UAE clinical cases',
    demoCasesSub: 'Evaluated live through the deterministic safety engine',
    openCaseBtn: 'Open case',
    newScanBtn: 'New scan',
    urgentBannerCall: 'Call 998 (UAE Ambulance)',
    safetyAlertsHeading: 'Clinical safety alerts',
    biomarkersHeading: 'Lab biomarkers',
    medicationsHeading: 'Daily medication schedule',
    allFilter: 'All markers',
    abnormalFilter: 'Out of range',
    referenceLabel: 'Reference',
    convertedFromLabel: 'Converted from',
    priorLabel: 'Prior',
    morningSlot: 'Morning',
    afternoonSlot: 'Afternoon',
    eveningSlot: 'Evening',
    bedtimeSlot: 'Bedtime',
    doctorPrepHeading: 'Questions for your doctor',
    doctorPrepSub: 'Prepared from out-of-range markers and medication checks',
    copyWhatsappBtn: 'Copy caregiver summary',
    copiedWhatsappBtn: 'Copied',
    printBtn: 'Print',
    listenBtn: 'Listen in English',
    stopAudioBtn: 'Stop audio',
    generatingAudioBtn: 'Preparing voice',
    disclaimerTitle: 'Clinical boundary',
    disclaimerText:
      'ShifaClear explains lab values and prepares questions for your physician. It does not diagnose medical conditions or change prescribed treatment.',
    statMarkers: 'Markers verified',
    statAttention: 'Out of range',
    statAlerts: 'Safety alerts',
    statMeds: 'Medications',
    voiceHandoffHeading: 'Voice and caregiver handoff',
    hideNote: 'Hide clinical note',
    showNote: 'Show clinical note',
    statusLabels: {
      critical_low: 'Critical low',
      low: 'Low',
      borderline_low: 'Borderline low',
      normal: 'Normal',
      borderline_high: 'Borderline high',
      high: 'High',
      critical_high: 'Critical high',
      unknown: 'Review',
    },
    foodLabels: {
      empty_stomach_separate: 'Empty stomach · 4h away from minerals',
      before_food: '30 min before meal',
      with_food: 'With meal',
      after_food: 'After food',
      any: 'With or without food',
    },
    riskBadges: {
      routine: 'Routine follow-up',
      attention: 'Needs physician review',
      urgent: 'Urgent attention required',
    },
  },
  ar: {
    tagline: 'افهم التحاليل المخبرية والوصفات الطبية بخمس لغات',
    subtitle:
      'يستخرج المؤشرات المخبرية وأسماء الأدوية في الإمارات، ويتحقق من كل قيمة وفق النطاقات المرجعية حسب العمر والجنس، ثم يشرحها بلغة واضحة للمريض والأسرة.',
    skipToMain: 'انتقل إلى المحتوى الرئيسي',
    elderMode: 'الخط الكبير',
    unitsLabel: 'الوحدات',
    auditTrailBtn: 'سجل التدقيق',
    qrSettingsBtn: 'QR والإعدادات',
    uploadTab: 'صورة أو PDF',
    pasteTab: 'لصق نص',
    dropzoneTitle: 'أفلت صورة التحليل المخبري أو الوصفة أو علبة الدواء هنا',
    dropzoneSubtitle: 'يدعم JPG وPNG وPDF حتى 10 ميغابايت',
    chooseFileBtn: 'اختيار ملف',
    pastePlaceholder: 'الصق قيم التحاليل أو نص الوصفة الطبية',
    analyzeBtn: 'التحقق والشرح',
    analyzingBtn: 'جاري التحقق السريري',
    patientContextTitle: 'سياق النطاق المرجعي',
    ageLabel: 'العمر',
    sexLabel: 'الجنس',
    male: 'ذكر',
    female: 'أنثى',
    demoCasesHeading: 'حالات سريرية من الإمارات',
    demoCasesSub: 'تُقيَّم مباشرة عبر محرك السلامة السريرية الحتمي',
    openCaseBtn: 'فتح الحالة',
    newScanBtn: 'فحص جديد',
    urgentBannerCall: 'اتصل بالإسعاف 998',
    safetyAlertsHeading: 'تنبيهات السلامة السريرية',
    biomarkersHeading: 'المؤشرات المخبرية',
    medicationsHeading: 'جدول الأدوية اليومي',
    allFilter: 'الكل',
    abnormalFilter: 'خارج النطاق',
    referenceLabel: 'النطاق المرجعي',
    convertedFromLabel: 'محوّل من',
    priorLabel: 'السابق',
    morningSlot: 'الصباح',
    afternoonSlot: 'الظهيرة',
    eveningSlot: 'المساء',
    bedtimeSlot: 'قبل النوم',
    doctorPrepHeading: 'أسئلة لموعد الطبيب',
    doctorPrepSub: 'مُعدّة بناءً على المؤشرات غير الطبيعية والتداخلات الدوائية',
    copyWhatsappBtn: 'نسخ ملخص الأسرة',
    copiedWhatsappBtn: 'تم النسخ',
    printBtn: 'طباعة',
    listenBtn: 'استمع بالعربية',
    stopAudioBtn: 'إيقاف الصوت',
    generatingAudioBtn: 'جاري تجهيز الصوت',
    disclaimerTitle: 'حدود الاستخدام السريري',
    disclaimerText:
      'يشرح شفاء كلير نتائج التحاليل ويساعد على تجهيز أسئلة للطبيب، ولا يقدّم تشخيصاً طبياً أو تعديلاً للجرعات.',
    statMarkers: 'مؤشرات مُتحقق منها',
    statAttention: 'خارج النطاق',
    statAlerts: 'تنبيهات السلامة',
    statMeds: 'الأدوية',
    voiceHandoffHeading: 'القراءة الصوتية وملخص الأسرة',
    hideNote: 'إخفاء الملاحظة السريرية',
    showNote: 'عرض الملاحظة السريرية',
    statusLabels: {
      critical_low: 'منخفض حرج',
      low: 'منخفض',
      borderline_low: 'حدّي منخفض',
      normal: 'طبيعي',
      borderline_high: 'حدّي مرتفع',
      high: 'مرتفع',
      critical_high: 'مرتفع حرج',
      unknown: 'للمراجعة',
    },
    foodLabels: {
      empty_stomach_separate: 'على معدة فارغة · يُفصل 4 ساعات عن المعادن',
      before_food: 'قبل الأكل بـ 30 دقيقة',
      with_food: 'مع الوجبة',
      after_food: 'بعد الأكل',
      any: 'مع أو بدون طعام',
    },
    riskBadges: {
      routine: 'متابعة روتينية',
      attention: 'يحتاج مراجعة الطبيب',
      urgent: 'يتطلب عناية عاجلة',
    },
  },
  ur: {
    tagline: 'پانچ زبانوں میں لیب رپورٹس اور نسخے واضح طور پر سمجھیں',
    subtitle:
      'یو اے ای کی لیب رپورٹس اور ادویات کو عمر اور جنس کے مطابق مستند طبی اصولوں پر جانچتا ہے اور مریض و خاندان کے لیے سادہ زبان میں پیش کرتا ہے۔',
    skipToMain: 'مرکزی مواد پر جائیں',
    elderMode: 'بڑا فونٹ',
    unitsLabel: 'یونٹس',
    auditTrailBtn: 'کلینیکل آڈٹ',
    qrSettingsBtn: 'QR اور API',
    uploadTab: 'تصویر یا PDF',
    pasteTab: 'متن پیسٹ کریں',
    dropzoneTitle: 'لیب رپورٹ، PDF یا دوا کے ڈبے کی تصویر یہاں رکھیں',
    dropzoneSubtitle: 'JPG، PNG، WebP یا PDF زیادہ سے زیادہ 10 MB',
    chooseFileBtn: 'فائل منتخب کریں',
    pastePlaceholder: 'لیب ٹیسٹ یا نسخے کا متن درج کریں',
    analyzeBtn: 'جانچ اور وضاحت کریں',
    analyzingBtn: 'طبی جانچ جاری ہے',
    patientContextTitle: 'نارمل رینج کا سیاق',
    ageLabel: 'عمر',
    sexLabel: 'جنس',
    male: 'مرد',
    female: 'خاتون',
    demoCasesHeading: 'یو اے ای کلینیکل کیسز',
    demoCasesSub: 'مستند طبی سیفٹی انجن پر براہ راست چلتے ہیں',
    openCaseBtn: 'کیس کھولیں',
    newScanBtn: 'نیا اسکین',
    urgentBannerCall: '998 (یو اے ای ایمبولینس) پر کال کریں',
    safetyAlertsHeading: 'طبی حفاظتی انتباہات',
    biomarkersHeading: 'لیب بائیو مارکرز',
    medicationsHeading: 'روزانہ ادویات کا شیڈول',
    allFilter: 'تمام ٹیسٹ',
    abnormalFilter: 'حد سے باہر',
    referenceLabel: 'نارمل رینج',
    convertedFromLabel: 'تبدیل شدہ از',
    priorLabel: 'سابقہ',
    morningSlot: 'صبح',
    afternoonSlot: 'دوپہر',
    eveningSlot: 'شام',
    bedtimeSlot: 'سونے سے پہلے',
    doctorPrepHeading: 'ڈاکٹر سے پوچھنے کے سوالات',
    doctorPrepSub: 'غیر معمولی نتائج اور ادویات کے باہمی اثر کی بنیاد پر',
    copyWhatsappBtn: 'فیملی خلاصہ کاپی کریں',
    copiedWhatsappBtn: 'کاپی ہو گیا',
    printBtn: 'پرنٹ',
    listenBtn: 'اردو میں سنیں',
    stopAudioBtn: 'آواز بند کریں',
    generatingAudioBtn: 'آواز تیار ہو رہی ہے',
    disclaimerTitle: 'طبی دائرہ کار',
    disclaimerText:
      'ShifaClear نتائج کی وضاحت اور ڈاکٹر کے لیے سوالات تیار کرنے میں مدد دیتا ہے۔ یہ تشخیص یا دوا کی تبدیلی کا متبادل نہیں۔',
    statMarkers: 'جانچے گئے ٹیسٹ',
    statAttention: 'حد سے باہر',
    statAlerts: 'حفاظتی انتباہ',
    statMeds: 'ادویات',
    voiceHandoffHeading: 'آواز اور فیملی خلاصہ',
    hideNote: 'طبی وضاحت چھپائیں',
    showNote: 'طبی وضاحت دیکھیں',
    statusLabels: {
      critical_low: 'انتہائی کم',
      low: 'کم',
      borderline_low: 'حد پر کم',
      normal: 'نارمل',
      borderline_high: 'حد پر زیادہ',
      high: 'زیادہ',
      critical_high: 'انتہائی زیادہ',
      unknown: 'جائزہ لیں',
    },
    foodLabels: {
      empty_stomach_separate: 'خالی پیٹ · کیلشیم/آئرن سے 4 گھنٹے الگ',
      before_food: 'کھانے سے 30 منٹ پہلے',
      with_food: 'کھانے کے ساتھ',
      after_food: 'کھانے کے بعد',
      any: 'کھانے کے ساتھ یا بغیر',
    },
    riskBadges: {
      routine: 'معمول کا فالو اپ',
      attention: 'ڈاکٹر کا معائنہ ضروری',
      urgent: 'فوری ایمرجنسی توجہ ضروری',
    },
  },
  tl: {
    tagline: 'Unawain ang lab report at reseta sa UAE sa limang wika',
    subtitle:
      'Sinusuri ang bawat resulta ng lab at gamot gamit ang malinaw na panuntunang medikal ayon sa edad at kasarian, at isinasalin sa simpleng wika para sa pasyente at pamilya.',
    skipToMain: 'Lumaktaw sa pangunahing nilalaman',
    elderMode: 'Malaking letra',
    unitsLabel: 'Yunit',
    auditTrailBtn: 'Audit trail',
    qrSettingsBtn: 'QR at API',
    uploadTab: 'Larawan o PDF',
    pasteTab: 'I-paste ang teksto',
    dropzoneTitle: 'Ilagay ang lab report, PDF, o larawan ng gamot',
    dropzoneSubtitle: 'JPG, PNG, WebP, o PDF hanggang 10 MB',
    chooseFileBtn: 'Pumili ng file',
    pastePlaceholder: 'I-paste ang resulta ng lab o reseta',
    analyzeBtn: 'Suriin at ipaliwanag',
    analyzingBtn: 'Nagsasagawa ng clinical verification',
    patientContextTitle: 'Konteksto ng normal range',
    ageLabel: 'Edad',
    sexLabel: 'Kasarian',
    male: 'Lalaki',
    female: 'Babae',
    demoCasesHeading: 'Mga kaso sa UAE',
    demoCasesSub: 'Direktang dumadaan sa deterministic safety engine',
    openCaseBtn: 'Buksan ang kaso',
    newScanBtn: 'Bagong scan',
    urgentBannerCall: 'Tumawag sa 998 (UAE Ambulance)',
    safetyAlertsHeading: 'Mga babalang pangkaligtasan',
    biomarkersHeading: 'Mga resulta sa lab',
    medicationsHeading: 'Araw-araw na iskedyul ng gamot',
    allFilter: 'Lahat',
    abnormalFilter: 'Lampas sa normal',
    referenceLabel: 'Normal range',
    convertedFromLabel: 'Na-convert mula sa',
    priorLabel: 'Nauna',
    morningSlot: 'Umaga',
    afternoonSlot: 'Tanghali',
    eveningSlot: 'Gabi',
    bedtimeSlot: 'Bago matulog',
    doctorPrepHeading: 'Mga tanong para sa doktor',
    doctorPrepSub: 'Hango sa mga resultang nangangailangan ng pansin',
    copyWhatsappBtn: 'Kopyahin ang buod',
    copiedWhatsappBtn: 'Nakopya',
    printBtn: 'I-print',
    listenBtn: 'Pakinggan sa Tagalog',
    stopAudioBtn: 'Itigil ang audio',
    generatingAudioBtn: 'Inihahanda ang boses',
    disclaimerTitle: 'Hangganang medikal',
    disclaimerText:
      'Ipinaliliwanag ng ShifaClear ang mga resulta at naghahanda ng tanong para sa doktor. Hindi ito nagbibigay ng diagnosis o nagbabago ng reseta.',
    statMarkers: 'Sinuring marker',
    statAttention: 'Lampas sa normal',
    statAlerts: 'Mga babala',
    statMeds: 'Mga gamot',
    voiceHandoffHeading: 'Boses at buod para sa pamilya',
    hideNote: 'Itago ang paliwanag',
    showNote: 'Ipakita ang paliwanag',
    statusLabels: {
      critical_low: 'Kritikal na mababa',
      low: 'Mababa',
      borderline_low: 'Medyo mababa',
      normal: 'Normal',
      borderline_high: 'Medyo mataas',
      high: 'Mataas',
      critical_high: 'Kritikal na mataas',
      unknown: 'Suriin',
    },
    foodLabels: {
      empty_stomach_separate: 'Walang laman ang tiyan · 4 oras pagitan sa mineral',
      before_food: '30 min bago kumain',
      with_food: 'Kasabay ng pagkain',
      after_food: 'Pagkatapos kumain',
      any: 'May laman man o wala ang tiyan',
    },
    riskBadges: {
      routine: 'Regular na follow-up',
      attention: 'Kailangan ng pagsusuri ng doktor',
      urgent: 'Kailangan ng agarang atensyon',
    },
  },
  hi: {
    tagline: 'पाँच भाषाओं में UAE लैब रिपोर्ट और दवाओं को सरलता से समझें',
    subtitle:
      'लैब मान और दवाओं को उम्र व लिंग आधारित चिकित्सकीय नियमों से सत्यापित करता है और मरीज़ व परिवार के लिए स्पष्ट भाषा में समझाता है।',
    skipToMain: 'मुख्य सामग्री पर जाएं',
    elderMode: 'बड़ा फ़ॉन्ट',
    unitsLabel: 'इकाइयाँ',
    auditTrailBtn: 'ऑडिट ट्रेल',
    qrSettingsBtn: 'QR और API',
    uploadTab: 'फ़ोटो या PDF',
    pasteTab: 'टेक्स्ट पेस्ट करें',
    dropzoneTitle: 'लैब रिपोर्ट, PDF या दवा के डिब्बे की फ़ोटो यहाँ डालें',
    dropzoneSubtitle: 'JPG, PNG, WebP या PDF 10 MB तक',
    chooseFileBtn: 'फ़ाइल चुनें',
    pastePlaceholder: 'लैब रिपोर्ट या प्रिस्क्रिप्शन का टेक्स्ट पेस्ट करें',
    analyzeBtn: 'सत्यापित करें और समझाएं',
    analyzingBtn: 'क्लिनिकल सत्यापन हो रहा है',
    patientContextTitle: 'सामान्य सीमा संदर्भ',
    ageLabel: 'उम्र',
    sexLabel: 'लिंग',
    male: 'पुरुष',
    female: 'महिला',
    demoCasesHeading: 'UAE क्लिनिकल केस',
    demoCasesSub: 'चिकित्सकीय सुरक्षा इंजन पर सीधे सत्यापित',
    openCaseBtn: 'केस खोलें',
    newScanBtn: 'नया स्कैन',
    urgentBannerCall: '998 (UAE एम्बुलेंस) पर कॉल करें',
    safetyAlertsHeading: 'चिकित्सकीय सुरक्षा चेतावनियाँ',
    biomarkersHeading: 'लैब बायोमार्कर',
    medicationsHeading: 'दैनिक दवा समय-सारिणी',
    allFilter: 'सभी मान',
    abnormalFilter: 'सीमा से बाहर',
    referenceLabel: 'सामान्य सीमा',
    convertedFromLabel: 'परिवर्तित',
    priorLabel: 'पिछला',
    morningSlot: 'सुबह',
    afternoonSlot: 'दोपहर',
    eveningSlot: 'शाम',
    bedtimeSlot: 'सोने से पहले',
    doctorPrepHeading: 'डॉक्टर के लिए प्रश्न',
    doctorPrepSub: 'असामान्य मानों और दवा सुरक्षा जांच के आधार पर',
    copyWhatsappBtn: 'परिवार सारांश कॉपी करें',
    copiedWhatsappBtn: 'कॉपी हो गया',
    printBtn: 'प्रिंट',
    listenBtn: 'हिन्दी में सुनें',
    stopAudioBtn: 'ऑडियो रोकें',
    generatingAudioBtn: 'आवाज़ तैयार हो रही है',
    disclaimerTitle: 'चिकित्सकीय सीमा',
    disclaimerText:
      'ShifaClear रिपोर्ट को सरल भाषा में समझाता है और डॉक्टर के लिए प्रश्न तैयार करता है। यह निदान नहीं करता और न ही दवा बदलता है।',
    statMarkers: 'सत्यापित मान',
    statAttention: 'सीमा से बाहर',
    statAlerts: 'सुरक्षा चेतावनी',
    statMeds: 'दवाएँ',
    voiceHandoffHeading: 'आवाज़ और परिवार सारांश',
    hideNote: 'चिकित्सकीय नोट छिपाएँ',
    showNote: 'चिकित्सकीय नोट देखें',
    statusLabels: {
      critical_low: 'अत्यंत कम',
      low: 'कम',
      borderline_low: 'सीमा पर कम',
      normal: 'सामान्य',
      borderline_high: 'सीमा पर अधिक',
      high: 'अधिक',
      critical_high: 'अत्यंत अधिक',
      unknown: 'समीक्षा करें',
    },
    foodLabels: {
      empty_stomach_separate: 'खाली पेट · कैल्शियम/आयरन से 4 घंटे अंतर',
      before_food: 'भोजन से 30 मिनट पहले',
      with_food: 'भोजन के साथ',
      after_food: 'भोजन के बाद',
      any: 'भोजन के साथ या बिना',
    },
    riskBadges: {
      routine: 'सामान्य फॉलो-अप',
      attention: 'डॉक्टर की समीक्षा आवश्यक',
      urgent: 'तुरंत आपातकालीन ध्यान आवश्यक',
    },
  },
};
