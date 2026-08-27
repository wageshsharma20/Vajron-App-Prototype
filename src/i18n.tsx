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
};

const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => translations.en[key],
  translateMetric: (label) => label
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
    return label;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t, translateMetric }}>
      {children}
    </I18nContext.Provider>
  );
};
