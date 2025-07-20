import { Dimensions, Platform, StatusBar } from 'react-native';

// الأبعاد
const { width, height } = Dimensions.get('window');

// ألوان التطبيق
const colors = {
  // الألوان الأساسية
  primary: '#FF6B6B',
  primaryLight: '#FF8E8E',
  primaryDark: '#E64A4A',
  secondary: '#4ECDC4',
  secondaryLight: '#7EF9F2',
  secondaryDark: '#009C95',
  
  // ألوان النص
  text: '#2D3436',
  textLight: '#636E72',
  textInverted: '#FFFFFF',
  
  // ألوان الخلفية
  background: '#F9F9F9',
  surface: '#FFFFFF',
  error: '#D32F2F',
  success: '#388E3C',
  warning: '#F57C00',
  info: '#1976D2',
  
  // ألوان إضافية
  gray: '#95A5A6',
  lightGray: '#ECF0F1',
  darkGray: '#7F8C8D',
  black: '#000000',
  white: '#FFFFFF',
  transparent: 'transparent',
  
  // ألوان التصنيفات
  food: '#FF9F43',
  drink: '#26C0C0',
  dessert: '#FF6B6B',
  bakery: '#A55EEA',
  other: '#7F8C8D'
};

// الخطوط
const fonts = {
  // العائلات
  regular: 'Cairo-Regular',
  medium: 'Cairo-Medium',
  semiBold: 'Cairo-SemiBold',
  bold: 'Cairo-Bold',
  
  // الأحجام
  h1: 32,
  h2: 24,
  h3: 20,
  h4: 18,
  h5: 16,
  h6: 14,
  body: 16,
  caption: 12,
  small: 10,
  
  // الأوزان
  light: '300',
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
  black: '900'
};

// الزوايا
const borderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: 9999
};

// المسافات
const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64
};

// الظلال
const shadows = {
  none: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  sm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
};

// الأنماط العامة
const commonStyles = {
  // الحاويات
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    flexGrow: 1,
    padding: spacing.md,
  },
  
  // النصوص
  text: {
    fontFamily: fonts.regular,
    color: colors.text,
    fontSize: fonts.body,
  },
  heading1: {
    fontFamily: fonts.bold,
    fontSize: fonts.h1,
    color: colors.text,
    marginBottom: spacing.md,
  },
  heading2: {
    fontFamily: fonts.bold,
    fontSize: fonts.h2,
    color: colors.text,
    marginBottom: spacing.md,
  },
  heading3: {
    fontFamily: fonts.semiBold,
    fontSize: fonts.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  bodyText: {
    fontFamily: fonts.regular,
    fontSize: fonts.body,
    color: colors.text,
    lineHeight: fonts.body * 1.5,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: fonts.caption,
    color: colors.textLight,
  },
  
  // الأزرار
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.secondary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: {
    fontFamily: fonts.medium,
    fontSize: fonts.h6,
    color: colors.white,
    textAlign: 'center',
  },
  buttonTextOutline: {
    color: colors.primary,
  },
  
  // حقول الإدخال
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: fonts.body,
    color: colors.text,
    textAlign: 'right',
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputLabel: {
    fontFamily: fonts.medium,
    fontSize: fonts.h6,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  inputErrorText: {
    fontFamily: fonts.regular,
    fontSize: fonts.caption,
    color: colors.error,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  
  // البطاقات
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  
  // العلامات
  tag: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.round,
    alignSelf: 'flex-start',
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  tagText: {
    fontFamily: fonts.medium,
    fontSize: fonts.caption,
  },
  
  // رأس الصفحة
  header: {
    backgroundColor: colors.white,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    ...Platform.select({
      android: {
        paddingTop: StatusBar.currentHeight,
        height: 60 + StatusBar.currentHeight,
      },
    }),
  },
  headerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fonts.h5,
    color: colors.text,
  },
  
  // التذييل
  footer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  
  // شريط التبويبات السفلي
  tabBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? spacing.sm : 0,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  tabButtonActive: {
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  tabButtonText: {
    fontFamily: fonts.medium,
    fontSize: fonts.caption,
    color: colors.gray,
    marginTop: spacing.xs,
  },
  tabButtonTextActive: {
    color: colors.primary,
  },
};

// التصدير
const theme = {
  colors,
  fonts,
  borderRadius,
  spacing,
  shadows,
  common: commonStyles,
  screen: {
    width,
    height,
    isSmallDevice: width < 375,
    isLargeDevice: width >= 768,
  },
  statusBarHeight: StatusBar.currentHeight || 0,
  isIos: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
};

export default theme;
