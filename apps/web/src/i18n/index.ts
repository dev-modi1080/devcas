import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      appName: 'CAS Digital Platform',
      tagline: 'Corporate Agri Sustainability',
      nav: {
        greenZone: 'Green Zone',
        mis: 'MIS Data Collection',
        trees: '100 Million Trees',
        masters: 'Master Data',
        dashboard: 'Dashboard',
        createRequest: 'Create Request',
        myRequests: 'My Requests',
        pendingApprovals: 'Pending Approvals',
        mortalityRequest: 'Mortality Request',
        globalReport: 'Global Search Report',
        yearlyBudget: 'Yearly Budget Entry',
        monthlyExpense: 'Monthly Expense Entry',
        myEntries: 'My Entries',
        targets: 'Yearly Target Entry',
        openingBalance: 'Opening Balances',
        settings: 'System Settings',
      },
      common: {
        search: 'Search',
        exportExcel: 'Export to Excel',
        exportPdf: 'Export to PDF',
        saveDraft: 'Save as Draft',
        submit: 'Submit for Approval',
        approve: 'Approve',
        reject: 'Reject',
        return: 'Return to Creator',
        callback: 'Callback Request',
        cancel: 'Cancel Request',
        remarks: 'Remarks',
        status: 'Status',
        action: 'Action',
        loading: 'Loading data...',
        noData: 'No records found',
      },
    },
  },
  hi: {
    // Hindi translations (Hindi-ready)
    translation: {
      appName: 'सीएएस डिजिटल प्लेटफॉर्म',
      tagline: 'कॉर्पोरेट कृषि स्थिरता',
      nav: {
        greenZone: 'ग्रीन ज़ोन',
        mis: 'एमआईएस डेटा संग्रह',
        trees: '10 करोड़ वृक्ष पहल',
        masters: 'मास्टर डेटा',
        dashboard: 'डैशबोर्ड',
        createRequest: 'अनुरोध बनाएं',
        myRequests: 'मेरे अनुरोध',
        pendingApprovals: 'लंबित अनुमोदन',
        mortalityRequest: 'मृत्यु दर अनुरोध',
        globalReport: 'वैश्विक खोज रिपोर्ट',
        yearlyBudget: 'वार्षिक बजट प्रविष्टि',
        monthlyExpense: 'मासिक व्यय प्रविष्टि',
        myEntries: 'मेरी प्रविष्टियाँ',
        targets: 'वार्षिक लक्ष्य प्रविष्टि',
        openingBalance: 'आरंभिक शेष',
        settings: 'सिस्टम सेटिंग्स',
      },
      common: {
        search: 'खोजें',
        exportExcel: 'एक्सेल में निर्यात करें',
        exportPdf: 'पीडीएफ में निर्यात करें',
        saveDraft: 'ड्राफ्ट के रूप में सहेजें',
        submit: 'अनुमोदन के लिए सबमिट करें',
        approve: 'स्वीकृत करें',
        reject: 'अस्वीकार करें',
        return: 'निर्माता को वापस भेजें',
        callback: 'अनुरोध वापस लें',
        cancel: 'अनुरोध रद्द करें',
        remarks: 'टिप्पणी',
        status: 'स्थिति',
        action: 'कार्रवाई',
        loading: 'डेटा लोड हो रहा है...',
        noData: 'कोई रिकॉर्ड नहीं मिला',
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('cas_lang') || 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
