import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, useTheme, RadioButton, HelperText } from 'react-native-paper';
import { Formik } from 'formik';
import * as yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { ERROR_MESSAGES } from '../../config';

const registerValidationSchema = yup.object().shape({
  name: yup
    .string()
    .required(ERROR_MESSAGES.REQUIRED_FIELD),
  email: yup
    .string()
    .email(ERROR_MESSAGES.INVALID_EMAIL)
    .required(ERROR_MESSAGES.REQUIRED_FIELD),
  phone: yup
    .string()
    .matches(/^[0-9]{10}$/, ERROR_MESSAGES.INVALID_PHONE)
    .required(ERROR_MESSAGES.REQUIRED_FIELD),
  password: yup
    .string()
    .min(8, ERROR_MESSAGES.PASSWORD_MIN_LENGTH)
    .required(ERROR_MESSAGES.REQUIRED_FIELD),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], ERROR_MESSAGES.PASSWORDS_DONT_MATCH)
    .required(ERROR_MESSAGES.REQUIRED_FIELD),
  role: yup
    .string()
    .oneOf(['client', 'seller'], ERROR_MESSAGES.INVALID_ROLE)
    .required(ERROR_MESSAGES.REQUIRED_FIELD),
});

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { colors } = useTheme();
  
  const handleRegister = async (values) => {
    try {
      setIsLoading(true);
      setError('');
      
      const { confirmPassword, ...userData } = values;
      const result = await register(userData);
      
      if (!result.success) {
        setError(result.message || ERROR_MESSAGES.REGISTRATION_FAILED);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>إنشاء حساب جديد</Text>
          <Text style={styles.subtitle}>انشئ حسابك للبدء في رحلتك مع FoodSaver DZ</Text>
        </View>

        <View style={styles.formContainer}>
          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          <Formik
            initialValues={{ 
              name: '',
              email: '',
              phone: '',
              password: '',
              confirmPassword: '',
              role: 'client' 
            }}
            validationSchema={registerValidationSchema}
            onSubmit={handleRegister}
          >
            {({ 
              handleChange, 
              handleBlur, 
              handleSubmit, 
              values, 
              errors, 
              touched,
              setFieldValue
            }) => (
              <>
                <TextInput
                  label="الاسم الكامل"
                  mode="outlined"
                  style={styles.input}
                  value={values.name}
                  onChangeText={handleChange('name')}
                  onBlur={handleBlur('name')}
                  right={<TextInput.Icon icon="account" />}
                  error={touched.name && errors.name}
                />
                {touched.name && errors.name && (
                  <HelperText type="error" visible={!!(touched.name && errors.name)}>
                    {errors.name}
                  </HelperText>
                )}

                <TextInput
                  label="البريد الإلكتروني"
                  mode="outlined"
                  style={styles.input}
                  value={values.email}
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  right={<TextInput.Icon icon="email" />}
                  error={touched.email && errors.email}
                />
                {touched.email && errors.email && (
                  <HelperText type="error" visible={!!(touched.email && errors.email)}>
                    {errors.email}
                  </HelperText>
                )}

                <TextInput
                  label="رقم الهاتف"
                  mode="outlined"
                  style={styles.input}
                  value={values.phone}
                  onChangeText={handleChange('phone')}
                  onBlur={handleBlur('phone')}
                  keyboardType="phone-pad"
                  right={<TextInput.Icon icon="phone" />}
                  error={touched.phone && errors.phone}
                />
                {touched.phone && errors.phone && (
                  <HelperText type="error" visible={!!(touched.phone && errors.phone)}>
                    {errors.phone}
                  </HelperText>
                )}

                <TextInput
                  label="كلمة المرور"
                  mode="outlined"
                  style={styles.input}
                  value={values.password}
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  secureTextEntry
                  right={<TextInput.Icon icon="lock" />}
                  error={touched.password && errors.password}
                />
                {touched.password && errors.password && (
                  <HelperText type="error" visible={!!(touched.password && errors.password)}>
                    {errors.password}
                  </HelperText>
                )}

                <TextInput
                  label="تأكيد كلمة المرور"
                  mode="outlined"
                  style={styles.input}
                  value={values.confirmPassword}
                  onChangeText={handleChange('confirmPassword')}
                  onBlur={handleBlur('confirmPassword')}
                  secureTextEntry
                  right={<TextInput.Icon icon="lock-check" />}
                  error={touched.confirmPassword && errors.confirmPassword}
                />
                {touched.confirmPassword && errors.confirmPassword && (
                  <HelperText type="error" visible={!!(touched.confirmPassword && errors.confirmPassword)}>
                    {errors.confirmPassword}
                  </HelperText>
                )}

                <View style={styles.roleContainer}>
                  <Text style={styles.roleLabel}>نوع الحساب</Text>
                  <View style={styles.radioGroup}>
                    <View style={styles.radioButton}>
                      <RadioButton.Android
                        value="client"
                        status={values.role === 'client' ? 'checked' : 'unchecked'}
                        onPress={() => setFieldValue('role', 'client')}
                        color={colors.primary}
                      />
                      <Text style={styles.radioLabel}>عميل</Text>
                    </View>
                    <View style={styles.radioButton}>
                      <RadioButton.Android
                        value="seller"
                        status={values.role === 'seller' ? 'checked' : 'unchecked'}
                        onPress={() => setFieldValue('role', 'seller')}
                        color={colors.primary}
                      />
                      <Text style={styles.radioLabel}>بائع</Text>
                    </View>
                  </View>
                  {touched.role && errors.role && (
                    <HelperText type="error" visible={!!(touched.role && errors.role)}>
                      {errors.role}
                    </HelperText>
                  )}
                </View>

                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  style={styles.button}
                  loading={isLoading}
                  disabled={isLoading}
                >
                  إنشاء حساب
                </Button>
              </>
            )}
          </Formik>

          <View style={styles.footer}>
            <Text style={styles.footerText}>لديك حساب بالفعل؟ </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>
                تسجيل الدخول
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 4,
    textAlign: 'right',
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 20,
    paddingVertical: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorContainer: {
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  roleContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  roleLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'right',
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  radioLabel: {
    marginRight: 4,
  },
});

export default RegisterScreen;
