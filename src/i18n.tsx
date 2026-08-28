import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'hi';

export const translations = {
  en: {
    overallScore: 'OVERALL SCORE',
    surveyComplete: 'SURVEY COMPLETE',
    considerationsFound: 'CONSIDERATIONS FOUND',
    recordingPaused: 'RECORDING PAUSED',
    paused: 'PAUSED',
    dashboard: 'DASHBOARD',
    recordings: 'RECORDINGS',
    reports: 'REPORTS',
    audit: 'AUDIT',
    treeSurvival: 'TREE SURVIVAL',
    greenCover: 'GREEN COVER',
    grassHealth: 'GRASS HEALTH',
    cleanliness: 'CLEANLINESS',
    infrastructureCondition: 'INFRASTRUCTURE CONDITION',
    irrigationEfficiency: 'IRRIGATION EFFICIENCY',
    safety: 'SAFETY',
    plantHealth: 'PLANT HEALTH',
    encroachmentRisk: 'ENCROACHMENT RISK',
    citizenReadiness: 'CITIZEN READINESS',
    initializing: 'INITIALIZING...',
    surveyed: 'SURVEYED',
  },
  hi: {
    overallScore: 'कुल स्कोर',
    surveyComplete: 'सर्वेक्षण पूर्ण',
    considerationsFound: 'विचारणीय बिंदु मिले',
    recordingPaused: 'रिकॉर्डिंग रोकी गई',
    paused: 'रोका गया',
    dashboard: 'डैशबोर्ड',
    recordings: 'रिकॉर्डिंग',
    reports: 'रिपोर्ट',
    audit: 'ऑडिट',
    treeSurvival: 'वृक्ष जीवित दर',
    greenCover: 'हरित आवरण',
    grassHealth: 'घास का स्वास्थ्य',
    cleanliness: 'स्वच्छता',
    infrastructureCondition: 'बुनियादी ढांचा',
    irrigationEfficiency: 'सिंचाई दक्षता',
    safety: 'सुरक्षा',
    plantHealth: 'पौधों का स्वास्थ्य',
    encroachmentRisk: 'अतिक्रमण जोखिम',
    citizenReadiness: 'नागरिक तत्परता',
    initializing: 'प्रारंभ हो रहा है...',
    surveyed: 'सर्वेक्षण किया गया',
  }
};

type I18nContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
  translateMetric: (label: string) => string;
  translateNumber: (num: string | number) => string;
  translateAny: (text?: string) => string;
};

const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => translations.en[key],
  translateMetric: (label) => label,
  translateNumber: (num) => String(num),
  translateAny: (text) => text || ""
});

export const useI18n = () => useContext(I18nContext);

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLang] = useState<Language>('en');

  const t = (key: keyof typeof translations.en) => {
    return translations[lang][key] || translations.en[key];
  };
  
  const metricMap: Record<string, keyof typeof translations.en> = {
    'TREE SURVIVAL': 'treeSurvival',
    'GREEN COVER': 'greenCover',
    'GRASS HEALTH': 'grassHealth',
    'CLEANLINESS': 'cleanliness',
    'INFRASTRUCTURE CONDITION': 'infrastructureCondition',
    'IRRIGATION EFFICIENCY': 'irrigationEfficiency',
    'SAFETY': 'safety',
    'PLANT HEALTH': 'plantHealth',
    'ENCROACHMENT RISK': 'encroachmentRisk',
    'CITIZEN READINESS': 'citizenReadiness'
  };

  const translateMetric = (label: string) => {
    const key = metricMap[label.toUpperCase()];
    if (key) {
      return translations[lang][key] || label;
    }
    return translateAny(label);
  };

  const translateAny = (text?: string) => {
    if (!text) return "";
    const dict: Record<string, string> = {
  "LIVE": "लाइव",
  "PAUSED": "रोका गया",
  "DRONE INFO": "ड्रोन की जानकारी",
  "Height": "ऊंचाई",
  "Speed": "गति",
  "Direction": "दिशा",
  "Battery": "बैटरी",
  "Flight Time": "उड़ान का समय",
  "SE": "दक्षिण-पूर्व",
  "km/h": "किमी/घंटा",
  "m": "मीटर",
  "0": "0",
  "1": "1",
  "58": "58",
  "65": "65",
  "Lawns, gazebo & hedge beds · lake & open water · algal channel & banks": "लॉन, गेज़ेबो और हेज बेड्स · झील और खुला पानी · शैवाल चैनल और किनारे",
  "Play area · lake edge · open-gym & lawns · footbridge": "खेल क्षेत्र · झील का किनारा · ओपन-जिम और लॉन · फुटब्रिज",
  "Palm avenue & lawns · formal beds & pathways · central axis & parterre": "पाम एवेन्यू और लॉन · औपचारिक क्यारियाँ और रास्ते · केंद्रीय अक्ष और पारटेर",
  "Flooded planting bed · play area · waterlogged ground · lawns & tree belt": "बाढ़ग्रस्त रोपण क्यारी · खेल क्षेत्र · जलभराव वाला मैदान · लॉन और ट्री बेल्ट",
  "Garden & tree canopy · pavilion (close-range)": "बगीचा और पेड़ की छतरी · मंडप (पास से)",
  "Children's play area · pathways & tree belt": "बच्चों के खेलने का क्षेत्र · रास्ते और ट्री बेल्ट",
  "Fountain & formal garden · central lawn & avenue · open gym & hedge beds": "फव्वारा और औपचारिक उद्यान · केंद्रीय लॉन और एवेन्यू · ओपन जिम और हेज बेड्स",
  "Rohini": "रोहिणी",
  "East Delhi": "पूर्वी दिल्ली",
  "North Delhi": "उत्तरी दिल्ली",
  "Mayur Vihar": "मयूर विहार",
  "Asaf Ali Road": "आसफ अली रोड",
  "Vasant Kunj": "वसंत कुंज",
  "Surveyed": "सर्वेक्षण किया गया",
  "18 May 2026": "18 मई 2026",
  "19 May 2026": "19 मई 2026",
  "20 May 2026": "20 मई 2026",
  "22 May 2026": "22 मई 2026",
  "Plant Health": "पौधों का स्वास्थ्य",
  "Plants & Trees": "पौधे और पेड़",
  "Irrigation Status": "सिंचाई की स्थिति",
  "Cleanliness": "स्वच्छता",
  "Asset Inventory": "संपत्ति सूची",
  "Infrastructure": "बुनियादी ढांचा",
  "Safety & Security": "सुरक्षा और बचाव",
  "Water Bodies": "जल निकाय",
  "1 ISSUE": "1 समस्या",
  "2 ISSUES": "2 समस्याएं",
  "3 ISSUES": "3 समस्याएं",
  "4 ISSUES": "4 समस्याएं",
  "5 ISSUES": "5 समस्याएं",
  "ALL CLEAR": "सब स्पष्ट",
  "HIGH IMPACT": "उच्च प्रभाव",
  "MEDIUM IMPACT": "मध्यम प्रभाव",
  "IMMEDIATE": "तत्काल",
  "Green vigour 69%": "हरापन 69%",
  "Needs multispectral — RGB only": "मल्टीस्पेक्ट्रल की आवश्यकता — केवल आरजीबी",
  "Not derivable from RGB": "आरजीबी से प्राप्त नहीं किया जा सकता",
  "11% bare / dry ground": "11% बंजर / सूखी ज़मीन",
  "Needs multispectral": "मल्टीस्पेक्ट्रल की आवश्यकता",
  "Single-date baseline": "एकल-तारीख आधार रेखा",
  "Health Index (NDVI)": "स्वास्थ्य सूचकांक (NDVI)",
  "Leaf Discoloration": "पत्तियों का रंग बदलना",
  "Pest/Disease": "कीट/रोग",
  "Water Stress": "पानी की कमी",
  "Nutrient Levels": "पोषक तत्वों का स्तर",
  "Growth Progress": "विकास की प्रगति",
  "Weed Infestation": "खरपतवार का प्रकोप",
  "Dry Zones": "सूखे क्षेत्र",
  "Litter": "कूड़ा",
  "Debris": "मलबा",
  "Fungal spots on rose garden": "गुलाब के बगीचे पर फंगल स्पॉट",
  "2 dry patches in east section": "पूर्वी भाग में 2 सूखे पैच",
  "28 litter items detected": "28 कूड़े की वस्तुएं पाई गईं",
  "Construction debris near north wall": "उत्तरी दीवार के पास निर्माण का मलबा",
  "Moderate weed growth near pathways": "रास्तों के पास मध्यम खरपतवार वृद्धि",
  "Green Cover": "हरित आवरण",
  "New Plantation Survival": "नए वृक्षारोपण की उत्तरजीविता",
  "Tree Canopy Growth": "पेड़ की छतरी का विकास",
  "Damaged Infrastructure": "क्षतिग्रस्त बुनियादी ढांचा",
  "North Delhi · Surveyed 19 May 2026": "उत्तरी दिल्ली · सर्वेक्षण 19 मई 2026",
  "East Delhi · Surveyed 19 May 2026": "पूर्वी दिल्ली · सर्वेक्षण 19 मई 2026",
  "Mayur Vihar · Surveyed 19 May 2026": "मयूर विहार · सर्वेक्षण 19 मई 2026",
  "Asaf Ali Road · Surveyed 18 May 2026": "आसफ अली रोड · सर्वेक्षण 18 मई 2026",
  "Vasant Kunj · Surveyed 18 May 2026": "वसंत कुंज · सर्वेक्षण 18 मई 2026",
  "Vasant Kunj · Surveyed 20 May 2026": "वसंत कुंज · सर्वेक्षण 20 मई 2026",
  "Palm avenue & lawns · formal beds & pathways · central axis": "पाम एवेन्यू और लॉन · औपचारिक क्यारियाँ और रास्ते · केंद्रीय अक्ष",
  "Flooded planting bed · play area · waterlogged open ground · lawns & tree belt": "बाढ़ग्रस्त रोपण क्यारी · खेल क्षेत्र · जलभराव वाला खुला मैदान · लॉन और ट्री बेल्ट",
  "Scheduled sites have no processed survey yet. Scores and findings appear once a flight has been flown and analysed.": "निर्धारित साइटों का अभी तक कोई सर्वेक्षण संसाधित नहीं हुआ है। उड़ान भरने और विश्लेषण के बाद स्कोर और निष्कर्ष दिखाई देते हैं।",
  "Recordings": "रिकॉर्डिंग",
  "Choose a park to view its drone survey": "ड्रोन सर्वेक्षण देखने के लिए एक पार्क चुनें",
  "SELECTED": "चयनित",
  "Displaying recent drone survey clips. Live data available for selected park.": "हाल ही के ड्रोन सर्वेक्षण क्लिप प्रदर्शित किए जा रहे हैं। चयनित पार्क के लिए लाइव डेटा उपलब्ध है।",
  "Past Data": "पिछला डेटा",
  "CHANGES THIS MONTH": "इस महीने के बदलाव",
  "VISUAL EVIDENCE (BEFORE & AFTER)": "दृश्य साक्ष्य (पहले और बाद में)",
  "North Gate Pathway Crack Repair": "उत्तरी द्वार मार्ग की दरार मरम्मत",
  "BEFORE": "पहले",
  "July 15, 2025": "15 जुलाई 2025",
  "AFTER": "बाद में",
  "Aug 04, 2025": "04 अगस्त 2025",
  "Lake Bank Vegetation Clearance": "झील के किनारे की वनस्पति की सफाई",
  "DOWNLOAD": "डाउनलोड",
  "DDA VERIFICATION": "डीडीए सत्यापन",
  "Automated Compliance & Audit": "स्वचालित अनुपालन और ऑडिट",
  "HIERARCHY SCORECARD": "पदानुक्रम स्कोरकार्ड",
  "Division": "प्रभाग",
  "Sub-Div": "उप-प्रभाग",
  "Park": "पार्क",
  "CONTRACTOR VERIFICATION": "ठेकेदार सत्यापन",
  "GreenEarth Maintenance Ltd.": "ग्रीनअर्थ मेंटेनेंस लिमिटेड",
  "AI Verified SLA": "एआई सत्यापित एसएलए",
  "Status": "स्थिति",
  "COMPLIANT": "अनुपालन",
  "SANCTIONED WORKS vs DRONE IMAGERY": "स्वीकृत कार्य बनाम ड्रोन इमेजरी",
  "Geo-Tagged": "जियो-टैग किया गया",
  "AI Confirmed": "एआई द्वारा पुष्ट",
  "PLAN": "योजना",
  "DRONE": "ड्रोन",
  "South Zone": "दक्षिण क्षेत्र",
  "SD-4": "एसडी-4",
  "Sanjay Van": "संजय वन",
  "Pathway Resurfacing (North Gate)": "मार्ग की मरम्मत (उत्तरी द्वार)",
  "VERIFIED": "सत्यापित",
  "Canopy Pruning (Zone C)": "छतरी की छंटाई (ज़ोन सी)",
  "UNEXECUTED": "अनिष्पादित",
  "Search...": "खोजें...",
  "surveyed": "सर्वेक्षण किया गया",
  "HIGH-PRIORITY DEFECTS": "उच्च-प्राथमिकता वाले दोष",
  "Encroachment": "अतिक्रमण",
  "Cleanliness Score": "स्वच्छता स्कोर",
  "Work Completion": "कार्य पूर्णता",
  "Lawn Health": "लॉन का स्वास्थ्य",
  "improved": "सुधार हुआ",
  "declined": "गिरावट आई",
  "%": "%",
  "items": "वस्तुएं",
  "8 items": "8 वस्तुएं",
  "5 items": "5 वस्तुएं",
  "incidents": "घटनाएं",
  "/100": "/100",
  "74%": "74%",
  "78%": "78%",
  "85%": "85%",
  "88%": "88%",
  "65%": "65%",
  "68%": "68%",
  "72%": "72%",
  "84%": "84%",
  "69%": "69%",
  "Landscape Quality": "परिदृश्य की गुणवत्ता",
  "good": "अच्छा",
  "attention": "ध्यान दें",
  "issue": "समस्या",
  "critical": "गंभीर",
  "low": "निम्न",
  "medium": "मध्यम",
  "high": "उच्च",
  "Asset GPS Locations": "परिसंपत्ति जीपीएस स्थान",
  "100% geo-tagged": "100% जियो-टैग किया गया",
  "Tree Geo-tagging": "पेड़ों की जियो-टैगिंग",
  "1,247 trees tagged": "1,247 पेड़ों को टैग किया गया",
  "Benches": "बेंच",
  "84 units mapped": "84 इकाइयों को मैप किया गया",
  "Dustbins": "कूड़ेदान",
  "42 units mapped": "42 इकाइयों को मैप किया गया",
  "Light Poles": "लाइट पोल",
  "120 units mapped": "120 इकाइयों को मैप किया गया",
  "Play Equipment": "खेल के उपकरण",
  "15 units mapped": "15 इकाइयों को मैप किया गया",
  "Irrigation Infra": "सिंचाई अवसंरचना",
  "3 pump stations, 12 valves": "3 पंप स्टेशन, 12 वाल्व",
  "Pathway Length": "रास्ते की लंबाई",
  "4.2 km total mapped": "कुल 4.2 किमी मैप किया गया",
  "Tree Count": "पेड़ों की संख्या",
  "1,247 trees mapped (32 new)": "1,247 पेड़ों को मैप किया गया (32 नए)",
  "Tree Health": "पेड़ों का स्वास्थ्य",
  "91% Healthy, 6% Stressed, 3% Diseased": "91% स्वस्थ, 6% तनावग्रस्त, 3% रोगग्रस्त",
  "Canopy Cover": "छतरी आवरण",
  "68% coverage": "68% कवरेज",
  "Lawn Coverage": "लॉन का कवरेज",
  "72% healthy, bare patches in Zone C": "72% स्वस्थ, ज़ोन C में खाली पैच",
  "Shrub Coverage": "झाड़ियों का कवरेज",
  "Adequate": "पर्याप्त",
  "Pruning Quality": "छंटाई की गुणवत्ता",
  "12 trees need pruning": "12 पेड़ों की छंटाई की आवश्यकता है",
  "Hedge Trimming": "हेज ट्रिमिंग",
  "Well maintained": "अच्छी तरह से बनाए रखा",
  "Flower Beds": "फूलों की क्यारियाँ",
  "3 beds need replanting": "3 क्यारियों में फिर से पौधे लगाने की आवश्यकता है",
  "Dead Vegetation": "मृत वनस्पति",
  "Minimal": "न्यूनतम",
  "0.76 (Healthy range)": "0.76 (स्वस्थ सीमा)",
  "Yellowing on 8 trees near lake": "झील के पास 8 पेड़ों पर पीलापन",
  "No stress detected": "कोई तनाव नहीं पाया गया",
  "Normal": "सामान्य",
  "+4% canopy density vs last month": "पिछले महीने की तुलना में +4% कैनोपी घनत्व",
  "Waterlogging": "जलभराव",
  "Minor pooling near gate 3": "गेट 3 के पास हल्का जलभराव",
  "Leak Detection": "रिसाव का पता लगाना",
  "No leaks found": "कोई रिसाव नहीं मिला",
  "Moisture Levels": "नमी का स्तर",
  "Even distribution": "समान वितरण",
  "Bin Status": "डस्टबिन की स्थिति",
  "3 bins overflowing (near food court)": "3 डस्टबिन ओवरफ्लो हो रहे हैं (फूड कोर्ट के पास)",
  "Green Waste": "हरा कचरा",
  "Leaf piles in 2 zones": "2 क्षेत्रों में पत्तियों के ढेर",
  "Water Stagnation": "जल जमाव",
  "None detected": "कुछ भी नहीं मिला",
  "Pathways": "रास्ते",
  "Cracked tiles on main walkway": "मुख्य मार्ग पर टूटी हुई टाइलें",
  "Gates": "द्वार",
  "All functional": "सभी चालू हैं",
  "Boundary Wall": "चारदीवारी",
  "Damaged section — 12m stretch, east side": "क्षतिग्रस्त हिस्सा — 12 मीटर तक, पूर्व की ओर",
  "Railing": "रेलिंग",
  "Rusted sections near lake edge": "झील के किनारे जंग लगे हिस्से",
  "4 benches need repair": "4 बेंचों की मरम्मत की आवश्यकता है",
  "All safe": "सभी सुरक्षित हैं",
  "Gym Equipment": "जिम के उपकरण",
  "Signage": "संकेतक",
  "2 signs faded": "2 संकेतक धुंधले हो गए हैं",
  "All working": "सभी काम कर रहे हैं",
  "Drinking Water": "पीने का पानी",
  "3 points operational": "3 नल चालू हैं",
  "Toilets": "शौचालय",
  "Clean and functional": "साफ और चालू हैं",
  "Parking": "पार्किंग",
  "Clear": "साफ़",
  "Gazebo/Pergola": "गेज़ेबो/पेर्गोला",
  "Roof intact, clean": "छत सुरक्षित, साफ है",
  "Excavations": "खुदाई",
  "Open trench near north gate": "उत्तरी द्वार के पास खुली खाई",
  "Utility Damage": "उपयोगिता क्षति",
  "Temporary structure near south gate": "दक्षिणी द्वार के पास अस्थायी संरचना",
  "Construction Activity": "निर्माण गतिविधि",
  "Vehicles Inside": "अंदर वाहन",
  "1 unauthorized vehicle (delivery van)": "1 अनाधिकृत वाहन (डिलीवरी वैन)",
  "Unsafe Trees": "असुरक्षित पेड़",
  "None identified": "कोई पहचान नहीं हुई",
  "Blind Spots": "ब्लाइंड स्पॉट्स",
  "All areas covered": "सभी क्षेत्र कवर किए गए",
  "Water Level": "जल स्तर",
  "Algae Growth": "शैवाल की वृद्धि",
  "Moderate in east pond": "पूर्वी तालाब में मध्यम",
  "Floating Waste": "तैरता हुआ कचरा",
  "Plastic waste in lake — 6 items": "झील में प्लास्टिक कचरा — 6 वस्तुएं",
  "Water Clarity": "पानी की स्पष्टता",
  "Bank Erosion": "किनारे का कटाव",
  "Stable": "स्थिर",
  "Fountain": "फव्वारा",
  "Operational": "चालू है",
  "Symmetry": "समरूपता",
  "Well balanced": "अच्छी तरह से संतुलित",
  "Colour Uniformity": "रंग एकरूपता",
  "Uneven flower colours in central bed": "केंद्रीय क्यारी में फूलों के रंग असमान हैं",
  "Vasant Kunj, New Delhi": "वसंत कुंज, नई दिल्ली",
  "2025-07-30": "2025-07-30",
  "09:45 AM": "09:45 AM",
  "85.2 m": "85.2 मीटर",
  "28.4 km/h": "28.4 किमी/घंटा",
  "124° SE": "124° दक्षिण-पूर्व",
  "18:35": "18:35",
  "28.5245° N, 77.1855° E": "28.5245° N, 77.1855° E",
  "12.4 hectares": "12.4 हेक्टेयर",
  "317 hectares": "317 हेक्टेयर",
  "Overall Park Health": "पार्क का समग्र स्वास्थ्य",
  "Tree Survival": "पेड़ों का बचना",
  "Grass Health": "घास का स्वास्थ्य",
  "Infrastructure Condition": "बुनियादी ढांचे की स्थिति",
  "Irrigation Efficiency": "सिंचाई दक्षता",
  "Safety": "सुरक्षा",
  "Encroachment Risk": "अतिक्रमण का जोखिम",
  "Citizen Readiness": "नागरिकों के लिए तैयारी",
  "Maintenance Priority": "रखरखाव प्राथमिकता",
  "Layout Compliance": "लेआउट अनुपालन",
  "up": "ऊपर",
  "down": "नीचे",
  "stable": "स्थिर",
  "Rohini DDA Park": "रोहिणी डीडीए पार्क",
  "Sanjay Lake": "संजय झील",
  "Lala Harydal Park": "लाला हरदयाल पार्क",
  "Smriti Van Mayur Vihar": "स्मृति वन मयूर विहार",
  "R Block Asaf Ali Park": "आर ब्लॉक आसफ अली पार्क",
  "Vasant Udyan": "वसंत उद्यान",
  "Vasant Vatika": "वसंत वाटिका",
  "ready": "तैयार",
  "scheduled": "निर्धारित",
  "3-clip survey": "3-क्लिप सर्वेक्षण",
  "4-clip survey": "4-क्लिप सर्वेक्षण",
  "2-clip survey": "2-क्लिप सर्वेक्षण",
  "Full Park Survey": "पूर्ण पार्क सर्वेक्षण",
  "Works Zone Clip": "कार्य क्षेत्र क्लिप",
  "Active construction on the park pathway · 38 s": "पार्क के रास्ते पर सक्रिय निर्माण · 38 सेकंड",
  "Palm Avenue & Lawns": "पाम एवेन्यू और लॉन",
  "Palm avenue and lawns · 76 s": "पाम एवेन्यू और लॉन · 76 सेकंड",
  "Formal Beds & Pathways": "औपचारिक क्यारियाँ और रास्ते",
  "Formal beds and pathways · 47 s": "औपचारिक क्यारियाँ और रास्ते · 47 सेकंड",
  "Central Axis & Parterre": "केंद्रीय अक्ष और पारटेर",
  "Central axis and parterre · 24 s": "केंद्रीय अक्ष और पारटेर · 24 सेकंड",
  "Garden & Tree Canopy": "बगीचा और पेड़ की छतरी",
  "Garden and tree canopy · 64 s": "बगीचा और पेड़ की छतरी · 64 सेकंड",
  "Pavilion": "मंडप",
  "Pavilion, close range · 41 s": "मंडप, पास से · 41 सेकंड",
  "Children's Play Area": "बच्चों के खेलने का क्षेत्र",
  "Children's play area · 42 s": "बच्चों के खेलने का क्षेत्र · 42 सेकंड",
  "Children's play area · 46 s": "बच्चों के खेलने का क्षेत्र · 46 सेकंड",
  "Pathways & Tree Belt": "रास्ते और ट्री बेल्ट",
  "Pathways and tree belt · 30 s": "रास्ते और ट्री बेल्ट · 30 सेकंड",
  "Flooded Planting Bed": "बाढ़ग्रस्त रोपण क्यारी",
  "Flooded planting bed zone · 17 s": "बाढ़ग्रस्त रोपण क्यारी क्षेत्र · 17 सेकंड",
  "Waterlogged Ground": "जलभराव वाला मैदान",
  "Waterlogged open ground · 35 s": "जलभराव वाला खुला मैदान · 35 सेकंड",
  "Lawns & Tree Belt": "लॉन और ट्री बेल्ट",
  "Lawns and tree belt zone · 38 s": "लॉन और ट्री बेल्ट क्षेत्र · 38 सेकंड",
  "Fountain & Formal Garden": "फव्वारा और औपचारिक उद्यान",
  "Fountain and formal garden · 11 s": "फव्वारा और औपचारिक उद्यान · 11 सेकंड",
  "Central Lawn & Avenue": "केंद्रीय लॉन और एवेन्यू",
  "Central lawn and avenue · 39 s": "केंद्रीय लॉन और एवेन्यू · 39 सेकंड",
  "Open Gym & Hedge Beds": "ओपन जिम और हेज बेड्स",
  "Open gym and hedge beds · 64 s": "ओपन जिम और हेज बेड्स · 64 सेकंड",
  "Lawns, Gazebo & Hedge Beds": "लॉन, गेज़ेबो और हेज बेड्स",
  "Lawns, gazebo and hedge beds · 37 s": "लॉन, गेज़ेबो और हेज बेड्स · 37 सेकंड",
  "Lake & Open Water": "झील और खुला पानी",
  "Lake and open water zone · 26 s": "झील और खुला पानी क्षेत्र · 26 सेकंड",
  "Algal Channel & Banks": "शैवाल चैनल और किनारे",
  "Algal channel and banks · 48 s": "शैवाल चैनल और किनारे · 48 सेकंड",
  "Overall Score": "कुल स्कोर",
  "Survey scheduled": "सर्वेक्षण निर्धारित",
  "Analysing recording": "रिकॉर्डिंग का विश्लेषण हो रहा है",
  "Recording paused": "रिकॉर्डिंग रोक दी गई",
  "Survey Complete": "सर्वेक्षण पूर्ण",
  "Considerations found": "विचारणीय बिंदु मिले",
  "AI MAINTENANCE RECOMMENDATIONS": "एआई रखरखाव अनुशंसाएँ",
  "Schedule Pruning (Zone C)": "छंटाई अनुसूची (ज़ोन सी)",
  "12 trees affecting light penetration": "12 पेड़ प्रकाश प्रवेश को प्रभावित कर रहे हैं",
  "Repair Pathway Crack (North Gate)": "रास्ते की दरार की मरम्मत (उत्तरी द्वार)",
  "Preventing water accumulation": "जल संचय को रोकना",
  "Clear Floating Waste (Lake)": "तैरते हुए कचरे को साफ करें (झील)",
  "6 plastic items detected": "6 प्लास्टिक वस्तुएं पाई गईं",

  // Fixed "not observed in this clip" labels from the live-inspection resolvers
  // (src/replay/useLiveInspection.ts) — each is its own distinct wording, so
  // they're matched as exact dict entries rather than folded into one generic
  // phrase.
  "No GPS sidecar — telemetry pending": "कोई जीपीएस साइडकार नहीं — टेलीमेट्री लंबित",
  "Not in this view": "इस दृश्य में नहीं",
  "None in this survey": "इस सर्वेक्षण में नहीं",
  "Not separable in oblique view": "तिरछे दृश्य में अलग नहीं किया जा सकता",
  "None visible in clip": "क्लिप में कुछ भी दिखाई नहीं दिया",
  "None in view yet": "अभी तक दृश्य में नहीं",
  "Not assessable at this altitude": "इस ऊंचाई पर आंकलन संभव नहीं",
  "Not assessable in this clip": "इस क्लिप में आंकलन संभव नहीं",
  "None in view": "दृश्य में कुछ नहीं",
  "None in this view": "इस दृश्य में कुछ नहीं",
  "Not legible at this altitude": "इस ऊंचाई पर पढ़ने योग्य नहीं",
  "Not separable from stems": "तनों से अलग नहीं किया जा सकता",
  "Not in view yet": "अभी दृश्य में नहीं आया",
  "None detected yet": "अभी तक कुछ नहीं मिला",
  "None seen in survey": "सर्वेक्षण में कुछ नहीं दिखा",
  "Regular avenue rows discernible": "नियमित एवेन्यू पंक्तियाँ स्पष्ट",
  "None flagged": "कुछ भी चिह्नित नहीं",
  "Moderate clarity": "मध्यम स्पष्टता",
  "Turbid green / olive": "गंदला हरा / जैतूनी",

  // Sign-in screen
  "Sign in": "साइन इन करें",
  "Secure identity verification.": "सुरक्षित पहचान सत्यापन।",
  "Username": "उपयोगकर्ता नाम",
  "Password": "पासवर्ड",
  "Forgot password?": "पासवर्ड भूल गए?",
  "Get Started": "शुरू करें",
  "Please enter both username and password.": "कृपया उपयोगकर्ता नाम और पासवर्ड दोनों दर्ज करें।",
  "Incorrect username or password.": "उपयोगकर्ता नाम या पासवर्ड गलत है।",
};
    if (lang === 'en') return text;
    if (dict[text]) return translateNumber(dict[text]);
    
    const t = text.trim();
    
    // Case-insensitive exact match
    let lowerT = t.toLowerCase();
    for (let key in dict) {
      if (key.toLowerCase() === lowerT) {
        return text.replace(t, translateNumber(dict[key]));
      }
    }

    
    
    // Also try purely lowercase
    if (dict[t.toLowerCase()]) return text.replace(t, translateNumber(dict[t.toLowerCase()]));

    
    let res = text;
    res = res.replace(/Green vigour/g, "हरापन");
    res = res.replace(/bare \/ dry ground/g, "बंजर / सूखी ज़मीन");
    res = res.replace(/litter items detected/g, "कचरा वस्तुएं पाई गईं");
    res = res.replace(/dry patches in east section/g, "पूर्वी हिस्से में सूखे पैच");
    res = res.replace(/trees affecting light penetration/g, "पेड़ प्रकाश प्रवेश को प्रभावित कर रहे हैं");
    res = res.replace(/plastic items detected/g, "प्लास्टिक वस्तुएं पाई गईं");
    res = res.replace(/Needs multispectral — RGB only/g, "मल्टीस्पेक्ट्रल की आवश्यकता — केवल आरजीबी");
    res = res.replace(/Not derivable from RGB/g, "आरजीबी से प्राप्त नहीं किया जा सकता");
    res = res.replace(/Needs multispectral/g, "मल्टीस्पेक्ट्रल की आवश्यकता");
    res = res.replace(/Single-date baseline/g, "एकल-तारीख आधार रेखा");
    res = res.replace(/ standing water/g, " जलभराव");
    res = res.replace(/ zones/g, " क्षेत्र");
    res = res.replace(/ground debris/g, "मलबा");
    res = res.replace(/litter \/ debris zones/g, "कूड़ा / मलबा क्षेत्र");
    res = res.replace(/waterlogged spots/g, "जलभराव वाले स्थान");
    res = res.replace(/Leaf litter/g, "पत्तियों का कचरा");
    res = res.replace(/of open ground/g, "खुली ज़मीन का");
    res = res.replace(/Uneven — large dry patches/g, "असमान — बड़े सूखे पैच");
    res = res.replace(/No irrigation infra visible/g, "सिंचाई का कोई बुनियादी ढांचा नहीं दिखा");
    res = res.replace(/ bare ground/g, " बंजर ज़मीन");
    res = res.replace(/No bin in this view/g, "इस दृश्य में कोई कूड़ेदान नहीं");
    res = res.replace(/canopy vigour/g, "छतरी का हरापन");
    res = res.replace(/grass across/g, "घास");
    res = res.replace(/ patches/g, " पैच में");
    res = res.replace(/Track detected/g, "रास्ता मिला");
    res = res.replace(/condition/g, "स्थिति");
    res = res.replace(/Kerb\/edging/g, "किनारा");
    res = res.replace(/displaced stones/g, "विस्थापित पत्थर");

    // Live-inspection resolvers (src/replay/useLiveInspection.ts) compose a
    // number/percentage with a fixed English suffix — translate the suffix in
    // place so the dynamic figure survives untouched. Several of these run
    // AFTER the generic " zones"/" patches" fragments above have already fired,
    // so they intentionally target what's left over rather than the original
    // phrase (e.g. "shrub/hedge zones" -> generic " zones" already ate "zones",
    // leaving "shrub/hedge" as the leftover this block finishes off).
    res = res.replace(/stems geo-tracked/g, "तने जियो-ट्रैक किए गए");
    res = res.replace(/benches mapped/g, "बेंच मैप किए गए");
    res = res.replace(/instances tracked/g, "इंस्टेंस ट्रैक किए गए");
    res = res.replace(/track segments/g, "ट्रैक खंड");
    res = res.replace(/stems tracked/g, "तने ट्रैक किए गए");
    res = res.replace(/(\d+) in view\)/g, "$1 दृश्य में)");
    res = res.replace(/of frame/g, "फ्रेम का");
    res = res.replace(/standing dry vegetation/g, "खड़ी सूखी वनस्पति");
    res = res.replace(/shrub\/hedge/g, "झाड़ी/हेज");
    res = res.replace(/litter \/ debris/g, "कूड़ा / मलबा");
    res = res.replace(/low-visibility/g, "निम्न-दृश्यता");
    res = res.replace(/\bzone\b/g, "क्षेत्र");
    res = res.replace(/benches —/g, "बेंच —");
    res = res.replace(/— mapped$/g, "— मैप किया गया");
    res = res.replace(/units — serviceable/g, "इकाइयाँ — उपयोग योग्य");
    res = res.replace(/vehicles? inside boundary/g, "वाहन सीमा के अंदर");
    res = res.replace(/waterlogged spot\b/g, "जलभराव वाला स्थान");
    res = res.replace(/Depleted —/g, "घट गया —");
    res = res.replace(/exposed bed/g, "उजागर तल");
    res = res.replace(/algal share of water/g, "पानी में शैवाल की हिस्सेदारी");
    res = res.replace(/floating-waste items/g, "तैरते कचरे की वस्तुएं");
    res = res.replace(/eroded \/ cracked bank segments/g, "क्षतिग्रस्त/दरारयुक्त किनारा खंड");
    res = res.replace(/Patchy —/g, "धब्बेदार —");
    res = res.replace(/ bare,/g, " बंजर,");
    res = res.replace(/canopy vigour/g, "छतरी का हरापन");
    res = res.replace(/canopy/g, "छतरी");

    res = res.replace(/Scheduled sites have no processed survey yet\. Scores and findings appear once a flight has been flown and analysed\./g, "निर्धारित साइटों का अभी तक कोई सर्वेक्षण संसाधित नहीं हुआ है। उड़ान भरने और विश्लेषण के बाद स्कोर और निष्कर्ष दिखाई देते हैं।");
    
    return translateNumber(res);
    return translateNumber(text); // translate any stray numbers even if string is not in dict
  };

  const translateNumber = (num?: string | number) => {
    if (num === undefined || num === null) return "";
    const str = String(num);
    if (lang === 'en') return str;
    return str;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t, translateMetric, translateNumber, translateAny }}>
      {children}
    </I18nContext.Provider>
  );
};
