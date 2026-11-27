import type {
  PatientContext,
  PatientNarrative,
  RawExtractedDocument,
  SupportedLanguage,
} from '@/lib/clinical/types';

export interface DemoCaseDefinition {
  id: 'uae-cardiometabolic' | 'uae-polypharmacy' | 'uae-critical-hyperkalemia';
  badge: string;
  accent: 'teal' | 'amber' | 'crimson';
  title: string;
  subtitle: string;
  highlights: string[];
  defaultContext: Omit<PatientContext, 'language'>;
  rawDocument: RawExtractedDocument;
  narratives: Record<SupportedLanguage, Omit<PatientNarrative, 'language' | 'source'>>;
}

export const DEMO_CASES: DemoCaseDefinition[] = [
  {
    id: 'uae-cardiometabolic',
    badge: 'Lab Panel + 6-Month Trend',
    accent: 'teal',
    title: 'Case 1: Abu Dhabi Cardiometabolic & Vitamin D Panel',
    subtitle: '54M • SEHA Ambulatory Clinic • Mixed US/SI units + 6-month progress comparison',
    highlights: [
      'Auto-converts Fasting Glucose (142 mg/dL → 7.9 mmol/L)',
      'Tracks 6-month HbA1c drop (8.4% → 7.2% Improving)',
      'Flags UAE-prevalent Vitamin D deficiency & high LDL',
    ],
    defaultContext: { age: 54, sex: 'male', unitSystem: 'SI' },
    rawDocument: {
      documentType: 'lab_report',
      reportDate: '2026-11-22',
      priorReportDate: '2026-05-18',
      facilityName: 'SEHA Ambulatory Health Services — Abu Dhabi',
      patientLabel: 'Adult Male (54y)',
      biomarkers: [
        { name: 'HbA1c', value: 7.2, unit: '%' },
        { name: 'Fasting Glucose', value: 142, unit: 'mg/dL' },
        { name: 'LDL Cholesterol', value: 4.3, unit: 'mmol/L' },
        { name: 'HDL Cholesterol', value: 0.95, unit: 'mmol/L' },
        { name: 'Triglycerides', value: 2.15, unit: 'mmol/L' },
        { name: 'eGFR', value: 64, unit: 'mL/min/1.73m²' },
        { name: 'Serum Creatinine', value: 114, unit: 'µmol/L' },
        { name: '25-OH Vitamin D', value: 34, unit: 'nmol/L' },
        { name: 'ALT', value: 36, unit: 'U/L' },
      ],
      priorBiomarkers: [
        { name: 'HbA1c', value: 8.4, unit: '%' },
        { name: 'Fasting Glucose', value: 178, unit: 'mg/dL' },
        { name: 'LDL Cholesterol', value: 4.95, unit: 'mmol/L' },
        { name: 'HDL Cholesterol', value: 0.9, unit: 'mmol/L' },
        { name: 'eGFR', value: 66, unit: 'mL/min/1.73m²' },
        { name: '25-OH Vitamin D', value: 28, unit: 'nmol/L' },
      ],
      medications: [],
    },
    narratives: {
      en: {
        headline: 'Good progress on blood sugar — cholesterol & Vitamin D still need attention',
        overallSummary:
          'Your 3-month average blood sugar (HbA1c) improved significantly from 8.4% down to 7.2%, showing your recent effort is working. However, fasting glucose and LDL ("bad") cholesterol remain elevated, kidney filtration (eGFR) is mildly reduced, and Vitamin D is deficient—very common in the UAE. Bring these results to your routine doctor visit to optimize heart and kidney protection.',
        biomarkerExplanations: {
          hba1c: {
            plainTitle: '3-Month Blood Sugar Average',
            whatItMeasures: 'Shows how much sugar has attached to red blood cells over the last 2–3 months.',
            whatYourLevelMeans: 'Still in the diabetic range (7.2%), but down a full 1.2 points from 8.4% six months ago—strong momentum.',
            practicalTip: 'Keep tracking post-meal walks and carbohydrate portions; ask your doctor about your personalized HbA1c target.',
          },
          glucose_fasting: {
            plainTitle: 'Fasting Blood Sugar',
            whatItMeasures: 'Blood sugar level after at least 8 hours without eating.',
            whatYourLevelMeans: 'Elevated at 7.9 mmol/L (auto-converted from 142 mg/dL), aligning with your HbA1c.',
            practicalTip: 'Confirm you fasted strictly with plain water only before the blood draw.',
          },
          ldl: {
            plainTitle: 'LDL ("Bad") Cholesterol',
            whatItMeasures: 'Cholesterol particles that can gradually build up inside heart and brain arteries.',
            whatYourLevelMeans: 'High at 4.30 mmol/L—especially important to lower alongside diabetes for long-term heart protection.',
            practicalTip: 'Ask your doctor about lipid-lowering therapy targets and reducing saturated fats/ghee.',
          },
          hdl: {
            plainTitle: 'HDL ("Protective") Cholesterol',
            whatItMeasures: 'Helps clear excess cholesterol away from artery walls.',
            whatYourLevelMeans: 'Slightly below the ideal level for men (0.95 mmol/L).',
            practicalTip: 'Brisk walking, olive oil, nuts, and fatty fish naturally support higher HDL.',
          },
          triglycerides: {
            plainTitle: 'Blood Fats (Triglycerides)',
            whatItMeasures: 'Circulating fats strongly tied to refined carbs, sugary drinks, and insulin resistance.',
            whatYourLevelMeans: 'Borderline high at 2.15 mmol/L.',
            practicalTip: 'Cutting sweetened karak/juices and white bread often lowers triglycerides quickly.',
          },
          egfr: {
            plainTitle: 'Kidney Filtration Rate (eGFR)',
            whatItMeasures: 'Estimates how efficiently your kidneys filter waste from blood.',
            whatYourLevelMeans: 'Mildly reduced (64) and stable compared with 6 months ago (66).',
            practicalTip: 'Ask your doctor for a urine albumin-to-creatinine ratio (uACR) test to check early kidney protection.',
          },
          creatinine: {
            plainTitle: 'Serum Creatinine',
            whatItMeasures: 'A normal muscle waste product cleared by the kidneys.',
            whatYourLevelMeans: 'Slightly above the upper male limit (114 µmol/L), matching the mildly reduced eGFR.',
            practicalTip: 'Stay well hydrated in Abu Dhabi heat and avoid regular over-the-counter NSAID painkillers.',
          },
          vitamin_d: {
            plainTitle: 'Vitamin D Level',
            whatItMeasures: 'Essential nutrient for bone strength, muscle energy, and immune health.',
            whatYourLevelMeans: 'Deficient (34 nmol/L), which is very common across the UAE despite sunny weather.',
            practicalTip: 'Ask your physician for a structured Vitamin D3 replenishment dose and recheck in 3 months.',
          },
          alt: {
            plainTitle: 'ALT Liver Enzyme',
            whatItMeasures: 'Reflects liver cell health.',
            whatYourLevelMeans: 'Reassuringly normal (36 U/L).',
            practicalTip: 'Good baseline if your doctor discusses cholesterol medication.',
          },
        },
        medicationExplanations: {},
        alertTranslations: {},
        doctorQuestions: [
          'My HbA1c dropped from 8.4% to 7.2% — should we keep my current diabetes plan or adjust toward < 7.0%?',
          'With LDL at 4.30 mmol/L and diabetes, what is my target LDL and should I start or adjust a statin?',
          'Since my eGFR is 64 and Vitamin D is 34 nmol/L, should we add a urine albumin (uACR) check and a Vitamin D3 replenishment prescription?',
        ],
        caregiverWhatsappSummary:
          'ShifaClear Lab Summary (54M • Nov 2026)\n• Great news: HbA1c improved 8.4% -> 7.2%\n• Still High: Fasting Glucose (7.9 mmol/L), LDL Cholesterol (4.30 mmol/L)\n• Low: Vitamin D (34 nmol/L — deficient)\n• Kidney check: eGFR 64 (stable, mildly reduced)\n• Next step: Routine doctor follow-up for cholesterol, Vitamin D3, and kidney urine check.',
        spokenSummaryScript:
          'Hello. Here is your ShifaClear lab summary. First, great news: your three-month blood sugar average, HbA1c, improved nicely from 8.4 percent down to 7.2 percent. Your liver enzyme is also completely normal. Three areas need follow-up with your doctor: your bad LDL cholesterol is elevated at 4.3, your Vitamin D is deficient at 34, and your kidney filtration eGFR is mildly reduced at 64, though stable. Please book a routine follow-up to discuss cholesterol protection and Vitamin D replacement.',
      },
      ar: {
        headline: 'تحسّن ملحوظ في السكر التراكمي — مع حاجة لمتابعة الكوليسترول وفيتامين د',
        overallSummary:
          'انخفض السكر التراكمي (HbA1c) بشكل ممتاز من 8.4% إلى 7.2% خلال 6 أشهر، ما يدل على نجاح التزامك. لا يزال السكر الصائم والكوليسترول الضار (LDL) مرتفعين، مع انخفاض طفيف ومستقر في معدل ترشيح الكلى (eGFR) ونقص في فيتامين د الشائع جداً في الإمارات. يُنصح بمراجعة طبيبك لتحسين حماية القلب والكلى.',
        biomarkerExplanations: {
          hba1c: {
            plainTitle: 'معدل السكر التراكمي (3 أشهر)',
            whatItMeasures: 'يعكس متوسط مستوى السكر في الدم خلال آخر شهرين إلى ثلاثة أشهر.',
            whatYourLevelMeans: 'لا يزال ضمن نطاق السكري (7.2%)، لكنه تحسن بمقدار 1.2 درجة مقارنة بـ 8.4% سابقاً.',
            practicalTip: 'استمر بالمشي بعد الوجبات وناقش مع طبيبك الهدف الأنسب لك.',
          },
          glucose_fasting: {
            plainTitle: 'سكر الدم الصائم',
            whatItMeasures: 'مستوى السكر بعد صيام 8 ساعات على الأقل.',
            whatYourLevelMeans: 'مرتفع عند 7.9 مليمول/لتر (تم تحويله تلقائياً من 142 ملغ/ديسيلتر).',
            practicalTip: 'تأكد من الصيام بالماء فقط قبل سحب العينة في الفحص القادم.',
          },
          ldl: {
            plainTitle: 'الكوليسترول الضار (LDL)',
            whatItMeasures: 'دهون قد تتراكم تدريجياً داخل جدران شرايين القلب.',
            whatYourLevelMeans: 'مرتفع (4.30 مليمول/لتر)، وخفضه مهم جداً لحماية القلب مع وجود السكري.',
            practicalTip: 'اسأل طبيبك عن الهدف المطلوب للكوليسترول الضار وخيارات العلاج.',
          },
          hdl: {
            plainTitle: 'الكوليسترول النافع (HDL)',
            whatItMeasures: 'يساعد في تنظيف الشرايين من الكوليسترول الزائد.',
            whatYourLevelMeans: 'أقل بقليل من المستوى المثالي للرجال (0.95 مليمول/لتر).',
            practicalTip: 'المشي السريع وزيت الزيتون والمكسرات النيئة ترفع الكوليسترول النافع.',
          },
          triglycerides: {
            plainTitle: 'الدهون الثلاثية',
            whatItMeasures: 'دهون مرتبطة بالسكريات والنشويات المكررة.',
            whatYourLevelMeans: 'مرتفعة بشكل حدّي (2.15 مليمول/لتر).',
            practicalTip: 'تقليل المشروبات المحلاة والخبز الأبيض يخفضها بسرعة.',
          },
          egfr: {
            plainTitle: 'معدل ترشيح الكلى (eGFR)',
            whatItMeasures: 'يقيس كفاءة الكليتين في تنقية الدم.',
            whatYourLevelMeans: 'منخفض بشكل طفيف (64) ومستقر مقارنة بالفحص السابق (66).',
            practicalTip: 'اطلب من طبيبك فحص زلال البول (uACR) للاطمئنان المبكر على الكلى.',
          },
          creatinine: {
            plainTitle: 'الكرياتينين في الدم',
            whatItMeasures: 'مادة طبيعية من العضلات تتخلص منها الكلى.',
            whatYourLevelMeans: 'مرتفع قليلاً (114 ميكرومول/لتر) بما يتوافق مع eGFR.',
            practicalTip: 'اشرب كمية كافية من الماء في طقس أبوظبي وتجنب مسكنات الالتهاب العشوائية.',
          },
          vitamin_d: {
            plainTitle: 'فيتامين د',
            whatItMeasures: 'ضروري لقوة العظام والعضلات والمناعة.',
            whatYourLevelMeans: 'نقص واضح (34 نانومول/لتر)، وهو شائع جداً في المنطقة.',
            practicalTip: 'اسأل طبيبك عن جرعة تعويضية مناسبة لفيتامين د3 وإعادة الفحص بعد 3 أشهر.',
          },
          alt: {
            plainTitle: 'إنزيم الكبد (ALT)',
            whatItMeasures: 'يعكس سلامة خلايا الكبد.',
            whatYourLevelMeans: 'طبيعي ومطمئن (36 وحدة/لتر).',
            practicalTip: 'نتيجة مطمئنة عند مناقشة أدوية الكوليسترول.',
          },
        },
        medicationExplanations: {},
        alertTranslations: {},
        doctorQuestions: [
          'تحسّن السكر التراكمي من 8.4% إلى 7.2% — هل نواصل نفس الخطة أم نهدف لأقل من 7.0%؟',
          'مع ارتفاع الكوليسترول الضار إلى 4.30 ووجود السكري، ما الهدف المناسب لي وهل أحتاج لبدء أو تعديل دواء الستاتين؟',
          'بما أن eGFR هو 64 وفيتامين د 34، هل نضيف فحص زلال البول (uACR) وجرعة تعويضية لفيتامين د3؟',
        ],
        caregiverWhatsappSummary:
          'ملخص تحاليل شفاء كلير:\n• خبر ممتاز: انخفض السكر التراكمي من 8.4% إلى 7.2%\n• مرتفع: السكر الصائم (7.9) والكوليسترول الضار (4.30)\n• منخفض: فيتامين د (34 — نقص)\n• الكلى: eGFR 64 (مستقر مع انخفاض بسيط)\n• الخطوة التالية: موعد متابعة مع الطبيب للكوليسترول وفيتامين د وفحص البول.',
        spokenSummaryScript:
          'مرحباً. إليك ملخص تحاليلك من شفاء كلير. الخبر السار أن السكر التراكمي تحسّن بشكل ممتاز من 8.4 بالمئة إلى 7.2 بالمئة، وإنزيم الكبد طبيعي تماماً. هناك ثلاث نقاط تحتاج متابعة مع الطبيب: الكوليسترول الضار مرتفع عند 4.3، وفيتامين د منخفض عند 34، ووظيفة الكلى مستقرة عند 64. يُنصح بحجز موعد متابعة لمناقشة خفض الكوليسترول وتعويض فيتامين د.',
      },
      ur: {
        headline: 'شوگر میں عمدہ بہتری — کولیسٹرول اور وٹامن ڈی پر توجہ ضروری ہے',
        overallSummary:
          'آپ کا 3 ماہ کا اوسط شوگر ٹیسٹ (HbA1c) 8.4% سے کم ہو کر 7.2% ہو گیا ہے، جو حوصلہ افزا ہے۔ تاہم فاسٹنگ شوگر اور خراب کولیسٹرول (LDL) ابھی زیادہ ہیں، گردے کی صفائی (eGFR) ہلکی کم لیکن مستحکم ہے، اور وٹامن ڈی کی کمی ہے۔',
        biomarkerExplanations: {
          hba1c: {
            plainTitle: 'تین ماہ کی اوسط شوگر (HbA1c)',
            whatItMeasures: 'گزشتہ 2 سے 3 ماہ میں خون میں شوگر کی اوسط سطح دکھاتا ہے۔',
            whatYourLevelMeans: 'ابھی 7.2% ہے لیکن چھ ماہ پہلے 8.4% سے نمایاں بہتر ہوا ہے۔',
            practicalTip: 'کھانے کے بعد چہل قدمی جاری رکھیں اور ڈاکٹر سے اپنا ہدف پوچھیں۔',
          },
          glucose_fasting: {
            plainTitle: 'نہار منہ شوگر',
            whatItMeasures: 'کم از کم 8 گھنٹے خالی پیٹ رہنے کے بعد خون میں شوگر۔',
            whatYourLevelMeans: '7.9 mmol/L (142 mg/dL سے خودکار تبدیل شدہ) جو معمول سے زیادہ ہے۔',
            practicalTip: 'ٹیسٹ سے پہلے صرف سادہ پانی پینے کی تصدیق کریں۔',
          },
          ldl: {
            plainTitle: 'خراب کولیسٹرول (LDL)',
            whatItMeasures: 'وہ چکنائی جو دل کی شریانوں میں جم سکتی ہے۔',
            whatYourLevelMeans: 'زیادہ ہے (4.30 mmol/L)؛ دل کی حفاظت کے لیے اسے کم کرنا اہم ہے۔',
            practicalTip: 'ڈاکٹر سے کولیسٹرول کی دوا اور تلی ہوئی غذا کم کرنے پر بات کریں۔',
          },
          vitamin_d: {
            plainTitle: 'وٹامن ڈی',
            whatItMeasures: 'ہڈیوں، پٹھوں اور قوتِ مدافعت کے لیے ضروری وٹامن۔',
            whatYourLevelMeans: 'کمی ہے (34 nmol/L)، جو یو اے ای میں بہت عام ہے۔',
            practicalTip: 'ڈاکٹر سے وٹامن D3 کورس کے بارے میں مشورہ کریں۔',
          },
        },
        medicationExplanations: {},
        alertTranslations: {},
        doctorQuestions: [
          'میرا HbA1c 8.4% سے 7.2% آ گیا ہے — کیا موجودہ دوا جاری رکھیں یا 7% سے کم کا ہدف رکھیں؟',
          'LDL 4.30 ہونے پر کیا مجھے کولیسٹرول (اسٹیٹن) کی دوا شروع یا تبدیل کرنی چاہیے؟',
          'eGFR 64 اور وٹامن ڈی 34 کے لیے کیا پیشاب کا پروٹین ٹیسٹ (uACR) اور وٹامن D3 تجویز کریں گے؟',
        ],
        caregiverWhatsappSummary:
          'ShifaClear رپورٹ خلاصہ:\n• اچھی خبر: HbA1c 8.4% سے 7.2% بہتر ہوا\n• زیادہ: فاسٹنگ شوگر (7.9)، LDL کولیسٹرول (4.30)\n• کم: وٹامن ڈی (34)\n• اگلا قدم: ڈاکٹر سے کولیسٹرول اور وٹامن ڈی کی روٹین ملاقات۔',
        spokenSummaryScript:
          'السلام علیکم۔ آپ کی رپورٹ میں خوشخبری یہ ہے کہ تین ماہ کا شوگر ٹیسٹ 8.4 سے کم ہو کر 7.2 ہو گیا ہے۔ البتہ خراب کولیسٹرول 4.3 زیادہ ہے اور وٹامن ڈی 34 کم ہے۔ براہ کرم ڈاکٹر سے کولیسٹرول اور وٹامن ڈی کے علاج پر مشورہ کریں۔',
      },
      tl: {
        headline: 'Magandang pagbuti sa blood sugar — kailangang bantayan ang cholesterol at Vitamin D',
        overallSummary:
          'Bumaba ang iyong 3-buwang average na blood sugar (HbA1c) mula 8.4% patungong 7.2%. Mataas pa rin ang fasting glucose at LDL ("masamang") cholesterol, bahagyang mababa pero matatag ang eGFR ng bato, at kulang sa Vitamin D na karaniwan sa UAE.',
        biomarkerExplanations: {
          hba1c: {
            plainTitle: '3-Buwang Average ng Blood Sugar',
            whatItMeasures: 'Ipinapakita ang karaniwang antas ng asukal sa dugo sa nakalipas na 2–3 buwan.',
            whatYourLevelMeans: 'Nasa diabetic range pa rin (7.2%), pero malaki ang ibinaba mula 8.4%.',
            practicalTip: 'Ipagpatuloy ang paglalakad pagkatapos kumain at itanong sa doktor ang target mo.',
          },
          ldl: {
            plainTitle: 'LDL ("Masamang") Cholesterol',
            whatItMeasures: 'Taba sa dugo na maaaring bumara sa mga ugat ng puso.',
            whatYourLevelMeans: 'Mataas sa 4.30 mmol/L — mahalagang pababain para sa kalusugan ng puso.',
            practicalTip: 'Tanungin ang doktor tungkol sa statin o pagbabago sa diyeta.',
          },
          vitamin_d: {
            plainTitle: 'Antas ng Vitamin D',
            whatItMeasures: 'Mahalaga para sa buto, kalamnan, at resistensya.',
            whatYourLevelMeans: 'Kulang (34 nmol/L), napakakaraniwan sa mga nakatira sa UAE.',
            practicalTip: 'Humingi ng tamang reseta ng Vitamin D3 supplement sa iyong doktor.',
          },
        },
        medicationExplanations: {},
        alertTranslations: {},
        doctorQuestions: [
          'Bumaba ang HbA1c ko mula 8.4% patungong 7.2% — dapat ba nating ipagpatuloy o i-adjust ang gamot?',
          'Sa LDL na 4.30 mmol/L, ano ang tamang target ko at kailangan ko na ba ng statin?',
          'Dahil 64 ang eGFR at 34 ang Vitamin D ko, kailangan ba ng urine albumin test (uACR) at Vitamin D3?',
        ],
        caregiverWhatsappSummary:
          'ShifaClear Lab Summary:\n• Magandang balita: HbA1c bumaba 8.4% -> 7.2%\n• Mataas: Fasting Glucose (7.9 mmol/L), LDL (4.30 mmol/L)\n• Kulang: Vitamin D (34 nmol/L)\n• Susunod: Magpa-check-up para sa cholesterol at Vitamin D3.',
        spokenSummaryScript:
          'Magandang araw. Magandang balita: bumaba ang iyong HbA1c mula 8.4 porsyento patungong 7.2 porsyento. Kailangan lamang bigyang-pansin ang mataas na LDL cholesterol na 4.3 at mababang Vitamin D na 34. Magpakonsulta sa doktor para sa tamang plano.',
      },
      hi: {
        headline: 'ब्लड शुगर में अच्छा सुधार — कोलेस्ट्रॉल और विटामिन डी पर ध्यान ज़रूरी है',
        overallSummary:
          'आपका 3-माह का औसत ब्लड शुगर (HbA1c) 8.4% से घटकर 7.2% हो गया है, जो बढ़िया सुधार है। हालांकि फास्टिंग शुगर और खराब कोलेस्ट्रॉल (LDL) अभी अधिक हैं, किडनी फ़िल्ट्रेशन (eGFR) हल्का कम लेकिन स्थिर है, और विटामिन डी की कमी है।',
        biomarkerExplanations: {
          hba1c: {
            plainTitle: '3-माह का औसत ब्लड शुगर',
            whatItMeasures: 'पिछले 2–3 महीनों के औसत रक्त शर्करा स्तर को दर्शाता है।',
            whatYourLevelMeans: 'अभी 7.2% है, पर 6 महीने पहले के 8.4% से काफी सुधरा है।',
            practicalTip: 'भोजन के बाद टहलना जारी रखें और डॉक्टर से अपना लक्ष्य पूछें।',
          },
          ldl: {
            plainTitle: 'LDL ("खराब") कोलेस्ट्रॉल',
            whatItMeasures: 'यह वसा हृदय की धमनियों में जम सकती है।',
            whatYourLevelMeans: 'अधिक है (4.30 mmol/L) — हृदय सुरक्षा के लिए इसे कम करना ज़रूरी है।',
            practicalTip: 'डॉक्टर से कोलेस्ट्रॉल दवा और आहार सुधार के बारे में पूछें।',
          },
          vitamin_d: {
            plainTitle: 'विटामिन डी स्तर',
            whatItMeasures: 'हड्डियों, मांसपेशियों और प्रतिरक्षा के लिए आवश्यक।',
            whatYourLevelMeans: 'कमी है (34 nmol/L), जो UAE में बहुत सामान्य है।',
            practicalTip: 'डॉक्टर से विटामिन D3 सप्लीमेंट की सही खुराक पूछें।',
          },
        },
        medicationExplanations: {},
        alertTranslations: {},
        doctorQuestions: [
          'मेरा HbA1c 8.4% से 7.2% हो गया है — क्या वर्तमान दवा जारी रखें या 7% से नीचे का लक्ष्य रखें?',
          'LDL 4.30 mmol/L होने पर क्या मुझे कोलेस्ट्रॉल (स्टेटिन) दवा शुरू या बदलनी चाहिए?',
          'eGFR 64 और विटामिन डी 34 के लिए क्या यूरिन एल्ब्यूमिन (uACR) जांच और विटामिन D3 लेना चाहिए?',
        ],
        caregiverWhatsappSummary:
          'ShifaClear लैब सारांश:\n• अच्छी खबर: HbA1c 8.4% -> 7.2% सुधरा\n• अधिक: फास्टिंग शुगर (7.9), LDL (4.30)\n• कम: विटामिन डी (34)\n• अगला कदम: डॉक्टर से कोलेस्ट्रॉल और विटामिन D3 पर सलाह लें।',
        spokenSummaryScript:
          'नमस्ते। अच्छी खबर है कि आपका तीन महीने का शुगर औसत HbA1c 8.4 प्रतिशत से घटकर 7.2 प्रतिशत हो गया है। हालांकि खराब कोलेस्ट्रॉल 4.3 अधिक है और विटामिन डी 34 कम है। कृपया डॉक्टर से मिलकर कोलेस्ट्रॉल और विटामिन डी की योजना बनाएं।',
      },
    },
  },
  {
    id: 'uae-polypharmacy',
    badge: 'Polypharmacy • Year of the Family',
    accent: 'amber',
    title: 'Case 2: Elderly Parent Multi-Drug Prescription',
    subtitle: '71F • Abu Dhabi Family Caregiver View • 6 UAE pharmacy brands',
    highlights: [
      'Detects "Triple Whammy" AKI risk (Cozaar + Lasix + Voltaren)',
      'Catches Euthyrox + Calcium-D3 4h absorption conflict & auto-reschedules',
      '1-click Elder Mode + Voice timetable for grandparents & caregivers',
    ],
    defaultContext: { age: 71, sex: 'female', unitSystem: 'SI' },
    rawDocument: {
      documentType: 'prescription',
      reportDate: '2026-11-25',
      facilityName: 'Abu Dhabi Outpatient Pharmacy Discharge',
      patientLabel: 'Elderly Female (71y)',
      biomarkers: [],
      medications: [
        {
          brandName: 'Euthyrox',
          dose: '75 mcg',
          frequency: 'OD morning',
          timingNotes: 'Take on empty stomach 30–60 minutes before breakfast with water only.',
        },
        {
          brandName: 'Cozaar',
          dose: '50 mg',
          frequency: 'OD morning',
          timingNotes: 'Blood pressure & kidney protective medication.',
        },
        {
          brandName: 'Lasix',
          dose: '40 mg',
          frequency: 'OD morning',
          timingNotes: 'Water tablet — take in the morning.',
        },
        {
          brandName: 'Glucophage',
          dose: '850 mg',
          frequency: 'BD',
          timingNotes: 'Take with breakfast and dinner.',
        },
        {
          brandName: 'Calcium-D3',
          dose: '600 mg',
          frequency: 'OD morning',
          timingNotes: 'Originally listed for morning — check thyroid interaction.',
        },
        {
          brandName: 'Voltaren',
          dose: '50 mg',
          frequency: 'BD',
          timingNotes: 'Take after food for knee pain (7 days).',
          duration: '7 days',
        },
      ],
    },
    narratives: {
      en: {
        headline: '2 Important Medication Safety Checks Found — Review Before Taking Voltaren',
        overallSummary:
          'We organized all 6 medicines into a simple morning-to-evening family schedule and caught two clinically important safety issues: (1) Combining Voltaren with Cozaar and Lasix creates a "Triple Whammy" kidney stress risk in older adults, and (2) Calcium-D3 was scheduled in the morning alongside Euthyrox, which blocks thyroid absorption—so we moved Calcium-D3 safely to Afternoon/Lunch.',
        biomarkerExplanations: {},
        medicationExplanations: {
          'med-1-levothyroxine': {
            plainPurpose: 'Replaces natural thyroid hormone to keep energy, heart rate, and metabolism steady.',
            howToTake: 'First thing on waking with a glass of plain water—wait 30 to 60 minutes before tea, coffee, or breakfast.',
            watchOutFor: 'Keep at least 4 hours away from Calcium-D3 so it absorbs properly.',
          },
          'med-2-losartan': {
            plainPurpose: 'Relaxes blood vessels to control blood pressure and protect the heart.',
            howToTake: 'Once every morning with or without food.',
            watchOutFor: 'Stand up slowly if dizzy; do not stop without talking to the doctor.',
          },
          'med-3-furosemide': {
            plainPurpose: 'Gentle water pill that removes extra fluid and reduces leg swelling or blood pressure.',
            howToTake: 'Take in the morning so bathroom trips happen during the day, not at night.',
            watchOutFor: 'Drink fluids as advised and watch for dizziness in hot weather.',
          },
          'med-4-metformin': {
            plainPurpose: 'Helps keep blood sugar steady throughout the day.',
            howToTake: 'Twice daily—right with breakfast and dinner to keep the stomach comfortable.',
            watchOutFor: 'If severe vomiting or dehydration occurs, ask the doctor whether to hold temporarily.',
          },
          'med-5-calciumvitamind3': {
            plainPurpose: 'Supports strong bones and reduces fracture risk.',
            howToTake: 'Moved to Lunch (Afternoon) with food—safely separated by 4+ hours from Euthyrox.',
            watchOutFor: 'Do not take at the same time as morning thyroid medicine.',
          },
          'med-6-diclofenac': {
            plainPurpose: 'Anti-inflammatory pain reliever prescribed for knee pain.',
            howToTake: 'HOLD & CONFIRM with doctor/pharmacist first due to the Triple Whammy kidney alert.',
            watchOutFor: 'Combining NSAIDs with Cozaar and Lasix can strain kidneys quickly in older adults.',
          },
        },
        alertTranslations: {
          'alert-triple-whammy': {
            title: 'High Kidney Risk Combination ("Triple Whammy")',
            explanation:
              'Taking Voltaren (painkiller) together with Cozaar (blood pressure pill) and Lasix (water pill) can sharply reduce blood flow to the kidneys.',
            action:
              'Call the prescribing doctor or pharmacist today to ask for a kidney-safer pain option (such as topical gel or paracetamol) before continuing Voltaren.',
          },
          'alert-thyroid-separation': {
            title: 'Timing Fix: Separate Euthyrox & Calcium-D3 by 4 Hours',
            explanation:
              'Calcium sticks to thyroid hormone in the stomach and prevents the body from absorbing the full dose.',
            action:
              'Give Euthyrox early morning with water alone, and give Calcium-D3 at Lunch (already adjusted in the schedule below).',
          },
        },
        doctorQuestions: [
          'Because my mother takes Cozaar and Lasix, can we replace oral Voltaren with a kidney-safer option for knee pain?',
          'Should we check kidney function (Creatinine/eGFR) and Potassium after any painkiller use?',
          'Is moving Calcium-D3 to lunch (4+ hours after Euthyrox) ideal for her thyroid levels?',
        ],
        caregiverWhatsappSummary:
          'ShifaClear Family Pill Schedule (71F)\n⚠️ ALERT 1: Ask doctor before giving Voltaren (Triple Whammy kidney risk with Cozaar + Lasix).\n⏰ ALERT 2: Keep Euthyrox (early morning, empty stomach) 4 hours away from Calcium-D3 (moved to Lunch).\n☀️ Morning: Euthyrox (empty stomach), then Cozaar, Lasix, Glucophage (with breakfast)\n🌤️ Lunch: Calcium-D3 (with food)\n🌇 Dinner: Glucophage (with meal)',
        spokenSummaryScript:
          'Hello family caregiver. Here is the safe medication plan. Important safety check first: please ask the doctor or pharmacist before giving Voltaren, because combining it with Cozaar and Lasix can stress the kidneys. Second, give Euthyrox early in the morning with plain water before breakfast, and move Calcium D3 to lunchtime, at least four hours later. Give Cozaar, Lasix, and the first Glucophage in the morning, and the second Glucophage with dinner.',
      },
      ar: {
        headline: 'تنبيهان مهمان لسلامة الأدوية — يُرجى مراجعة الطبيب قبل تناول الفولتارين',
        overallSummary:
          'رتبنا جميع الأدوية الستة في جدول يومي واضح للأسرة، واكتشفنا نقطتين مهمتين لسلامة الوالدة: (1) الجمع بين فولتارين وكوزار ولازيكس يشكل خطر "الثلاثي المضر بالكلى" لدى كبار السن، و(2) تناول الكالسيوم صباحاً مع يوثايروكس يمنع امتصاص دواء الغدة الدرقية — لذلك نقلنا الكالسيوم تلقائياً لوقت الغداء.',
        biomarkerExplanations: {},
        medicationExplanations: {
          'med-1-levothyroxine': {
            plainPurpose: 'يعوض هرمون الغدة الدرقية للحفاظ على النشاط ونبض القلب.',
            howToTake: 'أول شيء صباحاً على معدة فارغة مع كوب ماء قبل الإفطار بـ 30–60 دقيقة.',
            watchOutFor: 'يجب فصله 4 ساعات على الأقل عن حبة الكالسيوم.',
          },
          'med-2-losartan': {
            plainPurpose: 'ينظم ضغط الدم ويحمي القلب والأوعية الدموية.',
            howToTake: 'مرة واحدة صباحاً مع أو بدون طعام.',
            watchOutFor: 'لا يُوقف الدواء أبداً دون استشارة الطبيب.',
          },
          'med-3-furosemide': {
            plainPurpose: 'مدر للبول يزيل السوائل الزائدة وتورم القدمين.',
            howToTake: 'صباحاً لتجنب كثرة الاستيقاظ ليلاً.',
            watchOutFor: 'مراقبة الدوخة وشرب السوائل حسب توجيه الطبيب.',
          },
          'med-4-metformin': {
            plainPurpose: 'ينظم مستوى سكر الدم طوال اليوم.',
            howToTake: 'مرتين يومياً مع الإفطار والعشاء لتفادي ألم المعدة.',
            watchOutFor: 'استشارة الطبيب في حال الجفاف الشديد أو القيء.',
          },
          'med-5-calciumvitamind3': {
            plainPurpose: 'يقوي العظام ويحمي من الهشاشة.',
            howToTake: 'تم نقله إلى وقت الغداء مع الطعام (بفارق أكثر من 4 ساعات عن دواء الغدة).',
            watchOutFor: 'عدم تناوله صباحاً مع يوثايروكس.',
          },
          'med-6-diclofenac': {
            plainPurpose: 'مسكن مضاد للالتهاب لألم الركبة.',
            howToTake: 'توقف واستشر الطبيب أو الصيدلي أولاً بسبب تنبيه الكلى.',
            watchOutFor: 'قد يرهق الكلى بسرعة عند جمعه مع كوزار ولازيكس.',
          },
        },
        alertTranslations: {
          'alert-triple-whammy': {
            title: 'خطر مرتفع على الكلى (التداخل الثلاثي)',
            explanation:
              'الجمع بين فولتارين (مسكن) مع كوزار (للضغط) ولازيكس (مدر بول) يقلل تدفق الدم للكلى ويرفع خطر الإصابة الكلوية الحادة.',
            action:
              'تواصل مع الطبيب أو الصيدلي اليوم لاختيار بديل آمن للكلى (مثل جل موضعي أو باراسيتامول) قبل الاستمرار في فولتارين.',
          },
          'alert-thyroid-separation': {
            title: 'تعديل التوقيت: افصل يوثايروكس عن الكالسيوم 4 ساعات',
            explanation:
              'الكالسيوم يرتبط بدواء الغدة في المعدة ويقلل امتصاصه بنسبة تصل إلى 40%.',
            action:
              'يُعطى يوثايروكس صباحاً على معدة فارغة بالماء فقط، ويُعطى الكالسيوم مع الغداء (تم التعديل في الجدول).',
          },
        },
        doctorQuestions: [
          'بما أن الوالدة تتناول كوزار ولازيكس، هل يمكن استبدال حبوب فولتارين بمسكن آمن على الكلى لألم الركبة؟',
          'هل نحتاج لفحص وظائف الكلى والبوتاسيوم للاطمئنان؟',
          'هل نقل حبة الكالسيوم لوقت الغداء بعد 4 ساعات من يوثايروكس مناسب لثبات هرمون الغدة؟',
        ],
        caregiverWhatsappSummary:
          'جدول أدوية الوالدة (شفاء كلير):\n⚠️ تنبيه 1: استشارة الطبيب قبل إعطاء فولتارين (خطر على الكلى مع كوزار ولازيكس).\n⏰ تنبيه 2: فصل يوثايروكس صباحاً 4 ساعات عن الكالسيوم (تم نقله للغداء).\n☀️ الصباح: يوثايروكس على الريق، ثم كوزار ولازيكس وجلوكوفاج مع الفطور\n🌤️ الغداء: كالسيوم د3 مع الأكل\n🌇 العشاء: جلوكوفاج مع الأكل',
        spokenSummaryScript:
          'مرحباً. إليكم جدول الأدوية الآمن للوالدة. تنبيه مهم أولاً: يُرجى سؤال الطبيب أو الصيدلي قبل إعطاء حبوب فولتارين لأن جمعها مع كوزار ولازيكس قد يرهق الكلى. ثانياً: يُعطى دواء الغدة يوثايروكس صباحاً على معدة فارغة مع الماء فقط، وتم نقل حبة الكالسيوم إلى وقت الغداء بفارق أربع ساعات لضمان الامتصاص السليم.',
      },
      ur: {
        headline: 'ادویات کی حفاظت کے 2 اہم انتباہ — وولٹارین لینے سے پہلے ڈاکٹر سے پوچھیں',
        overallSummary:
          'ہم نے تمام 6 دوائیں آسان شیڈول میں ترتیب دی ہیں اور دو اہم خطرات پکڑے ہیں: (1) کوزار، لاسکس اور وولٹارین ایک ساتھ گردوں کے لیے نقصان دہ ہو سکتے ہیں، اور (2) کیلشیم کو تھائیرائیڈ کی دوا (Euthyrox) سے 4 گھنٹے الگ دوپہر میں منتقل کر دیا گیا ہے۔',
        biomarkerExplanations: {},
        medicationExplanations: {},
        alertTranslations: {
          'alert-triple-whammy': {
            title: 'گردوں کے لیے خطرناک امتزاج (Triple Whammy)',
            explanation: 'وولٹارین کو کوزار اور لاسکس کے ساتھ لینے سے گردوں پر شدید دباؤ پڑ سکتا ہے۔',
            action: 'وولٹارین جاری رکھنے سے پہلے ڈاکٹر یا فارماسسٹ سے محفوظ متبادل درد کی دوا پوچھیں۔',
          },
          'alert-thyroid-separation': {
            title: 'وقت کی درستی: Euthyrox اور کیلشیم میں 4 گھنٹے کا فرق',
            explanation: 'کیلشیم معدے میں تھائیرائیڈ دوا کے جذب ہونے کو روک دیتا ہے۔',
            action: 'Euthyrox صبح خالی پیٹ پانی کے ساتھ دیں اور کیلشیم دوپہر کے کھانے کے ساتھ۔',
          },
        },
        doctorQuestions: [
          'والدہ کوزار اور لاسکس لیتی ہیں — کیا گھٹنے کے درد کے لیے وولٹارین کی جگہ گردوں کے لیے محفوظ دوا دے سکتے ہیں؟',
          'کیا ہمیں گردوں کے ٹیسٹ (Creatinine/eGFR) کروانے چاہئیں؟',
          'کیا کیلشیم کو دوپہر میں منتقل کرنا تھائیرائیڈ دوا کے لیے بہتر ہے؟',
        ],
        caregiverWhatsappSummary:
          'ShifaClear فیملی شیڈول (71F):\n⚠️ انتباہ 1: وولٹارین دینے سے پہلے ڈاکٹر سے پوچھیں (کوزار + لاسکس کے ساتھ گردے کا خطرہ)\n⏰ انتباہ 2: Euthyrox صبح خالی پیٹ اور کیلشیم دوپہر کو دیں (4 گھنٹے فرق)',
        spokenSummaryScript:
          'السلام علیکم۔ اہم حفاظتی اطلاع: وولٹارین دینے سے پہلے ڈاکٹر سے مشورہ کریں کیونکہ کوزار اور لاسکس کے ساتھ یہ گردوں کو متاثر کر سکتی ہے۔ نیز تھائیرائیڈ کی دوا صبح خالی پیٹ اور کیلشیم دوپہر کے کھانے کے ساتھ دیں۔',
      },
      tl: {
        headline: '2 Mahalagang Babala sa Gamot — Kumonsulta Muna Bago Uminom ng Voltaren',
        overallSummary:
          'Inayos namin ang 6 na gamot sa malinaw na araw-araw na iskedyul at nakita ang dalawang panganib: (1) Ang pagsasama ng Voltaren, Cozaar, at Lasix ay nagdudulot ng "Triple Whammy" panganib sa bato, at (2) inilipat namin ang Calcium-D3 sa tanghalian upang may 4 na oras na pagitan mula sa Euthyrox.',
        biomarkerExplanations: {},
        medicationExplanations: {},
        alertTranslations: {
          'alert-triple-whammy': {
            title: 'Mataas na Panganib sa Bato ("Triple Whammy")',
            explanation: 'Ang sabay na pag-inom ng Voltaren, Cozaar, at Lasix ay maaaring biglang makapinsala sa bato ng nakatatanda.',
            action: 'Tanungin muna ang doktor o pharmacist para sa mas ligtas na gamot sa sakit ng tuhod bago ipagpatuloy ang Voltaren.',
          },
          'alert-thyroid-separation': {
            title: 'Tamang Oras: Ihiwalay ang Euthyrox at Calcium-D3 nang 4 Oras',
            explanation: 'Hinaharang ng calcium ang pagsipsip ng gamot sa thyroid.',
            action: 'Inumin ang Euthyrox sa umaga nang walang laman ang tiyan, at ang Calcium-D3 sa tanghalian.',
          },
        },
        doctorQuestions: [
          'Dahil umiinom siya ng Cozaar at Lasix, maaari bang palitan ang Voltaren ng mas ligtas na pain reliever para sa bato?',
          'Kailangan bang suriin ang kanyang kidney function (Creatinine/eGFR)?',
          'Tama ba na ilipat ang Calcium-D3 sa tanghalian nang 4 oras pagkatapos ng Euthyrox?',
        ],
        caregiverWhatsappSummary:
          'ShifaClear Caregiver Schedule (71F):\n⚠️ ALERT 1: Magtanong muna sa doktor bago ibigay ang Voltaren (panganib sa bato kasama ng Cozaar + Lasix).\n⏰ ALERT 2: Euthyrox sa umaga (walang laman ang tiyan); Calcium-D3 sa tanghalian (4 oras pagitan).',
        spokenSummaryScript:
          'Paalala para sa tagapag-alaga. Magtanong muna sa doktor bago magbigay ng Voltaren dahil maaari itong makasama sa bato kapag kasama ng Cozaar at Lasix. Ibigay ang Euthyrox sa umaga nang walang laman ang tiyan, at ilipat ang Calcium D3 sa tanghalian.',
      },
      hi: {
        headline: '2 महत्वपूर्ण दवा सुरक्षा चेतावनी — वोल्टारेन लेने से पहले डॉक्टर से सलाह लें',
        overallSummary:
          'हमने सभी 6 दवाओं को सरल समय-सारिणी में व्यवस्थित किया और दो सुरक्षा जोखिम पकड़े: (1) वोल्टारेन को कोज़ार और लैसिक्स के साथ लेने से किडनी पर गंभीर खतरा ("ट्रिपल व्हैमी") बढ़ता है, और (2) कैल्शियम-D3 को थायरॉइड दवा (Euthyrox) से 4 घंटे अलग दोपहर के भोजन में स्थानांतरित किया गया है।',
        biomarkerExplanations: {},
        medicationExplanations: {},
        alertTranslations: {
          'alert-triple-whammy': {
            title: 'किडनी के लिए उच्च जोखिम ("ट्रिपल व्हैमी")',
            explanation: 'वोल्टारेन, कोज़ार और लैसिक्स एक साथ लेने से बुजुर्गों में अचानक किडनी क्षति का जोखिम बढ़ जाता है।',
            action: 'वोल्टारेन जारी रखने से पहले डॉक्टर या फ़ार्मासिस्ट से किडनी के लिए सुरक्षित दर्द निवारक पूछें।',
          },
          'alert-thyroid-separation': {
            title: 'समय सुधार: Euthyrox और कैल्शियम में 4 घंटे का अंतर',
            explanation: 'कैल्शियम पेट में थायरॉइड दवा के अवशोषण को रोक देता है।',
            action: 'Euthyrox सुबह खाली पेट पानी के साथ लें और कैल्शियम दोपहर के भोजन के साथ।',
          },
        },
        doctorQuestions: [
          'चूँकि माताजी कोज़ार और लैसिक्स ले रही हैं, क्या घुटने के दर्द के लिए वोल्टारेन की जगह सुरक्षित विकल्प मिल सकता है?',
          'क्या किडनी फ़ंक्शन (क्रिएटिनिन/eGFR) की जांच करानी चाहिए?',
          'क्या कैल्शियम-D3 को दोपहर के भोजन में (Euthyrox से 4 घंटे बाद) लेना सही रहेगा?',
        ],
        caregiverWhatsappSummary:
          'ShifaClear दवा समय-सारिणी (71F):\n⚠️ चेतावनी 1: वोल्टारेन देने से पहले डॉक्टर से पूछें (कोज़ार + लैसिक्स के साथ किडनी जोखिम)।\n⏰ चेतावनी 2: Euthyrox सुबह खाली पेट और कैल्शियम-D3 दोपहर के भोजन में दें।',
        spokenSummaryScript:
          'नमस्ते। ज़रूरी सुरक्षा सूचना: कृपया वोल्टारेन देने से पहले डॉक्टर से पूछें क्योंकि कोज़ार और लैसिक्स के साथ यह किडनी पर असर डाल सकती है। थायरॉइड की दवा सुबह खाली पेट और कैल्शियम दोपहर के भोजन के साथ दें।',
      },
    },
  },
  {
    id: 'uae-critical-hyperkalemia',
    badge: 'Critical Panic Value • UAE 998',
    accent: 'crimson',
    title: 'Case 3: Urgent Hyperkalemia & Acute Kidney Drop',
    subtitle: '62M • Post-Dehydration Labs + Active Glucophage • Cross-Domain Safety Guardrail',
    highlights: [
      'Potassium 6.3 mmol/L triggers deterministic UAE 998 Emergency Alert',
      'eGFR 27 mL/min triggers cross-domain Metformin contraindication alert',
      'Proves safety never relies on LLM luck',
    ],
    defaultContext: { age: 62, sex: 'male', unitSystem: 'SI' },
    rawDocument: {
      documentType: 'mixed',
      reportDate: '2026-11-26',
      facilityName: 'Abu Dhabi Urgent Diagnostics Lab',
      patientLabel: 'Adult Male (62y)',
      biomarkers: [
        { name: 'Potassium (K+)', value: 6.3, unit: 'mmol/L' },
        { name: 'Serum Creatinine', value: 228, unit: 'µmol/L' },
        { name: 'eGFR', value: 27, unit: 'mL/min/1.73m²' },
        { name: 'Sodium (Na+)', value: 131, unit: 'mmol/L' },
        { name: 'Blood Urea', value: 16.4, unit: 'mmol/L' },
        { name: 'Hemoglobin', value: 12.4, unit: 'g/dL' },
      ],
      medications: [
        {
          brandName: 'Glucophage',
          dose: '1000 mg',
          frequency: 'BD',
          timingNotes: 'Currently taking twice daily with meals.',
        },
      ],
    },
    narratives: {
      en: {
        headline: 'URGENT: Dangerously High Potassium (6.3 mmol/L) & Acute Kidney Drop — Seek Emergency Care Now',
        overallSummary:
          'These lab results show a life-threatening electrolyte level: Potassium is critically high at 6.3 mmol/L, paired with a sharp drop in kidney filtration (eGFR 27). High potassium can suddenly affect heart rhythm, and Metformin (Glucophage) must be reviewed urgently when eGFR falls below 30. Please go to the nearest Emergency Department or call 998 immediately.',
        biomarkerExplanations: {
          potassium: {
            plainTitle: 'Blood Potassium (CRITICAL HIGH)',
            whatItMeasures: 'Controls the electrical signals that keep your heart beating steadily.',
            whatYourLevelMeans: 'Critically high at 6.3 mmol/L—this requires immediate emergency ECG monitoring and treatment.',
            practicalTip: 'Go to the Emergency Department right away; avoid potassium-rich foods (dates, bananas, orange juice) until cleared.',
          },
          creatinine: {
            plainTitle: 'Serum Creatinine (Kidney Waste)',
            whatItMeasures: 'Rises when kidneys temporarily slow down from dehydration, infection, or medications.',
            whatYourLevelMeans: 'Markedly elevated at 228 µmol/L, showing acute kidney strain.',
            practicalTip: 'Bring your full medication list to the ER immediately.',
          },
          egfr: {
            plainTitle: 'Kidney Filtration (eGFR — Low)',
            whatItMeasures: 'Estimates overall kidney filtering speed.',
            whatYourLevelMeans: 'Significantly reduced at 27—below the safe threshold (30) for standard Metformin use.',
            practicalTip: 'Tell the emergency physician right away that you take Glucophage (Metformin).',
          },
          sodium: {
            plainTitle: 'Blood Sodium',
            whatItMeasures: 'Balances body water and nerve function.',
            whatYourLevelMeans: 'Mildly low at 131 mmol/L, often seen with dehydration or gastroenteritis.',
            practicalTip: 'Emergency clinicians will rebalance electrolytes safely.',
          },
          urea: {
            plainTitle: 'Blood Urea',
            whatItMeasures: 'Protein waste cleared by kidneys; rises sharply with dehydration.',
            whatYourLevelMeans: 'Elevated at 16.4 mmol/L, reinforcing kidney stress/dehydration.',
            practicalTip: 'Requires IV hydration/evaluation in hospital.',
          },
          hemoglobin: {
            plainTitle: 'Hemoglobin (Red Blood Cells)',
            whatItMeasures: 'Carries oxygen throughout the body.',
            whatYourLevelMeans: 'Mildly below male reference range (124 g/L / 12.4 g/dL).',
            practicalTip: 'Not the immediate emergency—focus on urgent potassium and kidney care first.',
          },
        },
        medicationExplanations: {
          'med-1-metformin': {
            plainPurpose: 'Diabetes medicine cleared through the kidneys.',
            howToTake: 'URGENT PHYSICIAN REVIEW: Hold further doses until emergency doctor evaluates eGFR of 27.',
            watchOutFor: 'When eGFR drops below 30, Metformin can accumulate and cause lactic acidosis.',
          },
        },
        alertTranslations: {
          'panic-potassium': {
            title: 'EMERGENCY: Critical High Potassium (6.3 mmol/L)',
            explanation: 'Potassium at or above 6.0 mmol/L can trigger dangerous heart rhythm disturbances without warning.',
            action: 'Go to the nearest Emergency Department immediately or call 998 (UAE National Ambulance).',
          },
          'alert-metformin-renal': {
            title: 'Metformin Safety Hold Needed (eGFR 27 < 30)',
            explanation: 'Because kidney filtration dropped below 30, Glucophage (Metformin) cannot clear safely.',
            action: 'Inform the Emergency physician immediately that you take Glucophage 1000 mg twice daily.',
          },
        },
        doctorQuestions: [
          'My Potassium is 6.3 mmol/L and eGFR dropped to 27 — can I be evaluated immediately with an ECG?',
          'I take Glucophage 1000 mg twice daily — should I hold Metformin while my kidneys recover?',
          'Which of my current medicines or dehydration caused this acute kidney injury?',
        ],
        caregiverWhatsappSummary:
          '🚨 URGENT ShifaClear Alert (62M):\n• CRITICAL Potassium: 6.3 mmol/L — GO TO EMERGENCY / CALL 998 NOW\n• Acute kidney drop: Creatinine 228 µmol/L, eGFR 27\n• Med Alert: Takes Glucophage (Metformin) — inform ER doctor immediately (eGFR < 30).',
        spokenSummaryScript:
          'Urgent medical alert from ShifaClear. Your blood potassium is critically high at 6.3, and your kidney filtration has dropped sharply to 27. Because high potassium can affect heart rhythm, please go to the nearest Emergency Department immediately or call 998 in the UAE. Bring your Glucophage medication list so the emergency doctor can safely pause Metformin while treating your potassium.',
      },
      ar: {
        headline: 'عاجل جداً: ارتفاع حرج في البوتاسيوم (6.3) وهبوط حاد في وظيفة الكلى — توجه للطوارئ فوراً',
        overallSummary:
          'تُظهر هذه التحاليل مستوى حرجاً وخطيراً للبوتاسيوم في الدم (6.3 مليمول/لتر) بالتزامن مع هبوط حاد في معدل ترشيح الكلى (eGFR 27). قد يؤثر ارتفاع البوتاسيوم فجأة على انتظام نبض القلب، كما يجب مراجعة دواء جلوكوفاج فوراً عند هبوط eGFR تحت 30. يُرجى التوجه لأقرب قسم طوارئ أو الاتصال بالإسعاف 998 فوراً.',
        biomarkerExplanations: {
          potassium: {
            plainTitle: 'البوتاسيوم في الدم (مرتفع بشكل حرج)',
            whatItMeasures: 'يتحكم في الإشارات الكهربائية التي تحافظ على انتظام نبضات القلب.',
            whatYourLevelMeans: 'مرتفع بشكل خطير (6.3 مليمول/لتر) ويتطلب تخطيط قلب وعلاجاً عاجلاً في الطوارئ.',
            practicalTip: 'تجنب التمر والموز وعصير البرتقال وتوجه للطوارئ الآن.',
          },
          egfr: {
            plainTitle: 'معدل ترشيح الكلى (منخفض بشدة)',
            whatItMeasures: 'يعكس كفاءة تنقية الكليتين للدم.',
            whatYourLevelMeans: 'انخفض إلى 27، وهو دون الحد الآمن (30) لتناول دواء جلوكوفاج (الميتفورمين).',
            practicalTip: 'أخبر طبيب الطوارئ فوراً بتناولك لدواء جلوكوفاج.',
          },
        },
        medicationExplanations: {
          'med-1-metformin': {
            plainPurpose: 'دواء للسكري يتم التخلص منه عبر الكلى.',
            howToTake: 'مراجعة طبية عاجلة فوراً قبل تناول أي جرعة إضافية بسبب هبوط eGFR تحت 30.',
            watchOutFor: 'تراكم الميتفورمين عند قصور الكلى الحاد قد يسبب الحماض اللاكتيكي.',
          },
        },
        alertTranslations: {
          'panic-potassium': {
            title: 'حالة طوارئ: ارتفاع حرج للبوتاسيوم (6.3 مليمول/لتر)',
            explanation: 'ارتفاع البوتاسيوم إلى 6.0 فأكثر قد يسبب اضطراباً خطيراً ومفاجئاً في نظم القلب.',
            action: 'توجه إلى أقرب قسم طوارئ فوراً أو اتصل بالإسعاف الوطني 998 الآن.',
          },
          'alert-metformin-renal': {
            title: 'تنبيه عاجل بخصوص جلوكوفاج (eGFR أقل من 30)',
            explanation: 'بسبب انخفاض ترشيح الكلى إلى 27 لا يمكن إخراج الميتفورمين بأمان.',
            action: 'أبلغ طبيب الطوارئ فوراً بتناولك جلوكوفاج 1000 ملغ مرتين يومياً.',
          },
        },
        doctorQuestions: [
          'البوتاسيوم 6.3 ووظيفة الكلى eGFR 27 — أحتاج لتقييم طارئ وتخطيط قلب فوراً.',
          'أتناول جلوكوفاج 1000 ملغ مرتين يومياً — هل أوقفه مؤقتاً لحين تحسن الكلى؟',
          'هل الجفاف أو أحد أدويتي تسبب في هذا القصور الكلوي الحاد؟',
        ],
        caregiverWhatsappSummary:
          '🚨 تنبيه طارئ من شفاء كلير:\n• البوتاسيوم مرتفع بشكل خطير: 6.3 — التوجه للطوارئ أو الاتصال بـ 998 فوراً\n• هبوط حاد في الكلى: eGFR 27\n• تنبيه دوائي: يتناول جلوكوفاج (أبلغ طبيب الطوارئ فوراً).',
        spokenSummaryScript:
          'تنبيه طبي عاجل من شفاء كلير. مستوى البوتاسيوم في الدم مرتفع بشكل حرج عند 6.3 مع هبوط حاد في وظيفة الكلى إلى 27. يُرجى التوجه إلى أقرب قسم طوارئ فوراً أو الاتصال بالإسعاف 998، وإبلاغ الطبيب بتناول دواء جلوكوفاج.',
      },
      ur: {
        headline: 'فوری ایمرجنسی: پوٹاشیم خطرناک حد تک زیادہ (6.3) — فوراً ایمرجنسی جائیں',
        overallSummary:
          'خون میں پوٹاشیم انتہائی خطرناک سطح (6.3 mmol/L) پر ہے اور گردے کی کارکردگی (eGFR 27) شدید گر گئی ہے۔ پوٹاشیم دل کی دھڑکن متاثر کر سکتا ہے اور eGFR 30 سے کم ہونے پر گلوکوفیج (میٹفارمن) روکنا ضروری ہو سکتا ہے۔ فوراً قریبی ایمرجنسی جائیں یا 998 پر کال کریں۔',
        biomarkerExplanations: {},
        medicationExplanations: {},
        alertTranslations: {
          'panic-potassium': {
            title: 'ایمرجنسی: پوٹاشیم خطرناک حد تک زیادہ (6.3)',
            explanation: '6.0 سے زیادہ پوٹاشیم دل کی دھڑکن کے لیے فوری خطرہ بن سکتا ہے۔',
            action: 'فوراً قریبی ایمرجنسی جائیں یا 998 پر کال کریں۔',
          },
          'alert-metformin-renal': {
            title: 'گلوکوفیج (میٹفارمن) فوری طبی جائزہ (eGFR 27)',
            explanation: 'گردے کی کارکردگی 30 سے کم ہونے پر میٹفارمن محفوظ طریقے سے خارج نہیں ہوتی۔',
            action: 'ایمرجنسی ڈاکٹر کو فوراً بتائیں کہ آپ گلوکوفیج لے رہے ہیں۔',
          },
        },
        doctorQuestions: [
          'پوٹاشیم 6.3 اور eGFR 27 ہے — براہ کرم فوری ECG اور ایمرجنسی معائنہ کریں۔',
          'میں گلوکوفیج 1000mg لیتا ہوں — کیا گردے ٹھیک ہونے تک اسے روک دوں؟',
          'اس اچانک گردے کی کمزوری کی وجہ پانی کی کمی ہے یا کوئی دوا؟',
        ],
        caregiverWhatsappSummary:
          '🚨 فوری ایمرجنسی الرٹ (ShifaClear):\n• پوٹاشیم 6.3 (خطرناک) — فوراً ایمرجنسی / 998 کال کریں\n• eGFR 27 اور گلوکوفیج الرٹ۔',
        spokenSummaryScript:
          'فوری طبی انتباہ۔ خون میں پوٹاشیم خطرناک حد تک زیادہ 6.3 ہے اور گردے کی کارکردگی 27 تک گر گئی ہے۔ براہ کرم فوراً ایمرجنسی جائیں یا 998 پر کال کریں۔',
      },
      tl: {
        headline: 'AGARANG BABALA: Kritikal na Mataas na Potassium (6.3) — Pumunta Agad sa Emergency',
        overallSummary:
          'Ang potassium sa dugo ay kritikal na mataas (6.3 mmol/L) at biglang bumaba ang function ng bato (eGFR 27). Maaari itong makaapekto sa tibok ng puso, at kailangang suriin agad ang Glucophage kapag mas mababa sa 30 ang eGFR. Pumunta agad sa Emergency o tumawag sa 998.',
        biomarkerExplanations: {},
        medicationExplanations: {},
        alertTranslations: {
          'panic-potassium': {
            title: 'EMERGENCY: Kritikal na Mataas na Potassium (6.3 mmol/L)',
            explanation: 'Ang potassium na 6.0 pataas ay maaaring magdulot ng mapanganib na problema sa tibok ng puso.',
            action: 'Pumunta agad sa pinakamalapit na Emergency Department o tumawag sa 998.',
          },
          'alert-metformin-renal': {
            title: 'Babala sa Glucophage / Metformin (eGFR 27 < 30)',
            explanation: 'Kapag bumaba sa 30 ang eGFR, hindi ligtas ang normal na pag-inom ng Metformin.',
            action: 'Sabihin agad sa emergency doctor na umiinom ka ng Glucophage 1000 mg.',
          },
        },
        doctorQuestions: [
          '6.3 ang Potassium ko at 27 ang eGFR — maaari ba akong ma-ECG agad?',
          'Umiinom ako ng Glucophage 1000 mg — kailangan ko bang itigil muna habang bumabawi ang bato ko?',
          'Dehydration ba o gamot ang sanhi ng pagbaba ng kidney function ko?',
        ],
        caregiverWhatsappSummary:
          '🚨 URGENT ShifaClear Alert:\n• CRITICAL Potassium 6.3 — PUMUNTA SA EMERGENCY / TUMAWAG SA 998 NGAYON\n• eGFR 27 + Glucophage safety alert.',
        spokenSummaryScript:
          'Agarang babalang medikal. Kritikal na mataas ang iyong potassium sa 6.3 at bumaba sa 27 ang function ng bato. Pumunta agad sa pinakamalapit na Emergency o tumawag sa 998.',
      },
      hi: {
        headline: 'तुरंत आपातकाल: पोटैशियम खतरनाक रूप से अधिक (6.3) — अभी इमरजेंसी जाएं',
        overallSummary:
          'रक्त में पोटैशियम खतरनाक स्तर (6.3 mmol/L) पर है और किडनी फ़िल्ट्रेशन (eGFR 27) तेजी से गिर गया है। उच्च पोटैशियम हृदय की धड़कन को प्रभावित कर सकता है, और eGFR 30 से कम होने पर ग्लूकोफेज (मेटफॉर्मिन) की तुरंत समीक्षा ज़रूरी है। कृपया तुरंत इमरजेंसी जाएं या 998 पर कॉल करें।',
        biomarkerExplanations: {},
        medicationExplanations: {},
        alertTranslations: {
          'panic-potassium': {
            title: 'आपातकाल: अत्यंत उच्च पोटैशियम (6.3 mmol/L)',
            explanation: '6.0 या अधिक पोटैशियम अचानक गंभीर हृदय गति विकार पैदा कर सकता है।',
            action: 'तुरंत नजदीकी इमरजेंसी विभाग जाएं या 998 पर कॉल करें।',
          },
          'alert-metformin-renal': {
            title: 'ग्लूकोफेज / मेटफॉर्मिन सुरक्षा चेतावनी (eGFR 27 < 30)',
            explanation: 'किडनी फ़िल्ट्रेशन 30 से नीचे होने पर मेटफॉर्मिन सुरक्षित रूप से शरीर से बाहर नहीं निकलती।',
            action: 'इमरजेंसी डॉक्टर को तुरंत बताएं कि आप ग्लूकोफेज 1000 mg ले रहे हैं।',
          },
        },
        doctorQuestions: [
          'मेरा पोटैशियम 6.3 और eGFR 27 है — क्या तुरंत ECG और आपातकालीन जांच हो सकती है?',
          'मैं ग्लूकोफेज 1000 mg लेता हूँ — क्या किडनी ठीक होने तक इसे रोकना चाहिए?',
          'क्या डिहाइड्रेशन या किसी दवा के कारण किडनी फ़ंक्शन अचानक गिरा है?',
        ],
        caregiverWhatsappSummary:
          '🚨 आपातकालीन ShifaClear अलर्ट:\n• गंभीर पोटैशियम: 6.3 — तुरंत इमरजेंसी जाएं / 998 कॉल करें\n• eGFR 27 और ग्लूकोफेज सुरक्षा चेतावनी।',
        spokenSummaryScript:
          'तुरंत चिकित्सा चेतावनी। आपका पोटैशियम खतरनाक रूप से अधिक 6.3 है और किडनी फ़ंक्शन 27 तक गिर गया है। कृपया तुरंत नजदीकी इमरजेंसी अस्पताल जाएं या 998 पर कॉल करें।',
      },
    },
  },
];

export function getDemoCaseById(id: string): DemoCaseDefinition | undefined {
  return DEMO_CASES.find((c) => c.id === id);
}
