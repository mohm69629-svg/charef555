// تكوين API الأساسي
export const API_BASE_URL = 'http://localhost:5000/api/v1';

// تكوين الخريطة
// يمكنك استبدال مفتاح API بمفتاح Google Maps API الخاص بك
// يمكن الحصول على المفتاح من: https://developers.google.com/maps/documentation/javascript/get-api-key
export const MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

// تكوين Firebase
// يمكنك الحصول على هذه المعلومات من وحدة تحكم Firebase
// https://console.firebase.google.com/
export const FIREBASE_CONFIG = {
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'your-app.firebaseapp.com',
  projectId: 'your-app',
  storageBucket: 'your-app.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
  measurementId: 'YOUR_MEASUREMENT_ID'
};

// تكوين التطبيق
export const APP_CONFIG = {
  appName: 'FoodSaver DZ',
  defaultLanguage: 'ar', // اللغة الافتراضية (العربية)
  supportedLanguages: ['ar', 'fr', 'en'], // اللغات المدعومة
  defaultTheme: 'light', // السمة الافتراضية
  currency: 'DZD', // العملة
  currencySymbol: 'د.ج', // رمز العملة
  maxUploadSize: 5 * 1024 * 1024, // الحد الأقصى لحجم الملفات المرفوعة (5 ميجابايت)
  version: '1.0.0' // إصدار التطبيق
};

// رسائل الخطأ العامة
export const ERROR_MESSAGES = {
  networkError: 'حدث خطأ في الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.',
  serverError: 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.',
  unauthorized: 'غير مصرح لك بالوصول إلى هذه الصفحة. يرجى تسجيل الدخول أولاً.',
  forbidden: 'ليس لديك صلاحية للوصول إلى هذه الصفحة.',
  notFound: 'الصفحة المطلوبة غير موجودة.',
  validationError: 'البيانات المدخلة غير صحيحة. يرجى مراجعة الحقول المطلوبة.',
  default: 'حدث خطأ ما. يرجى المحاولة مرة أخرى.'
};

// رسائل النجاح العامة
export const SUCCESS_MESSAGES = {
  profileUpdated: 'تم تحديث الملف الشخصي بنجاح',
  passwordChanged: 'تم تغيير كلمة المرور بنجاح',
  dataSaved: 'تم حفظ البيانات بنجاح',
  operationCompleted: 'تمت العملية بنجاح'
};

// تكوين الروابط
export const LINKS = {
  privacyPolicy: 'https://example.com/privacy-policy',
  termsOfService: 'https://example.com/terms-of-service',
  contactUs: 'https://example.com/contact-us',
  aboutUs: 'https://example.com/about-us',
  helpCenter: 'https://example.com/help-center'
};

// تكوين الإشعارات
export const NOTIFICATION_CONFIG = {
  position: 'top',
  duration: 3000,
  offset: 30,
  animationType: 'slide'
};

// تكوين التخزين المحلي
export const STORAGE_KEYS = {
  authToken: '@FoodSaverDZ:authToken',
  userData: '@FoodSaverDZ:userData',
  language: '@FoodSaverDZ:language',
  theme: '@FoodSaverDZ:theme',
  onboarding: '@FoodSaverDZ:onboardingCompleted'
};

// تصنيفات المتاجر
export const STORE_CATEGORIES = [
  { id: 'restaurant', name: 'مطعم', icon: 'restaurant' },
  { id: 'bakery', name: 'مخبز', icon: 'bakery-dining' },
  { id: 'cafe', name: 'مقهى', icon: 'local-cafe' },
  { id: 'grocery', name: 'بقالة', icon: 'shopping-bag' },
  { id: 'supermarket', name: 'سوبرماركت', icon: 'shopping-cart' },
  { id: 'pastry', name: 'حلويات', icon: 'cake' },
  { id: 'juice', name: 'عصائر', icon: 'local-drink' },
  { id: 'ice-cream', name: 'آيس كريم', icon: 'icecream' },
  { id: 'other', name: 'أخرى', icon: 'more-horiz' }
];

// أوقات الاستلام المتاحة
export const PICKUP_TIMES = [
  '08:00 - 10:00',
  '10:00 - 12:00',
  '12:00 - 14:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
  '18:00 - 20:00',
  '20:00 - 22:00'
];

// تكوين التقييمات
export const RATINGS = [
  { value: 5, label: 'ممتاز' },
  { value: 4, label: 'جيد جداً' },
  { value: 3, label: 'جيد' },
  { value: 2, label: 'مقبول' },
  { value: 1, label: 'سيئ' }
];

export default {
  API_BASE_URL,
  MAPS_API_KEY,
  FIREBASE_CONFIG,
  APP_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LINKS,
  NOTIFICATION_CONFIG,
  STORAGE_KEYS,
  STORE_CATEGORIES,
  PICKUP_TIMES,
  RATINGS
};
