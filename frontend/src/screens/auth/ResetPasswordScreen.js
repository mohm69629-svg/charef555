import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText } from 'react-native-paper';
import { Formik } from 'formik';
import * as yup from 'yup';
import axios from 'axios';
import { useRoute, useNavigation } from '@react-navigation/native';
import { API_URL } from '../../config';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../config';

const resetPasswordSchema = yup.object().shape({
  password: yup
    .string()
    .min(8, ERROR_MESSAGES.PASSWORD_MIN_LENGTH)
    .required(ERROR_MESSAGES.REQUIRED_FIELD),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], ERROR_MESSAGES.PASSWORDS_DONT_MATCH)
    .required(ERROR_MESSAGES.REQUIRED_FIELD),
});

const ResetPasswordScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { colors } = useTheme();
  
  // Get token from route params
  const token = route.params?.token || '';
  
  const handleResetPassword = async (values) => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      // In a real app, you would make an API call here
      // await axios.post(`${API_URL}/auth/reset-password`, {
      //   token,
      //   password: values.password
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(SUCCESS_MESSAGES.PASSWORD_RESET);
      
      // Navigate to login after a short delay
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
      
    } catch (error) {
      console.error('Reset password error:', error);
      setError(error.response?.data?.message || ERROR_MESSAGES.SERVER_ERROR);
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
          <Text style={styles.title}>إعادة تعيين كلمة المرور</Text>
          <Text style={styles.subtitle}>أدخل كلمة المرور الجديدة لحسابك</Text>
        </View>

        <View style={styles.formContainer}>
          {error ? (
            <View style={[styles.messageContainer, { backgroundColor: colors.errorContainer }]}>
              <Text style={[styles.messageText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}
          
          {success ? (
            <View style={[styles.messageContainer, { backgroundColor: colors.secondaryContainer }]}>
              <Text style={[styles.messageText, { color: colors.onSecondaryContainer }]}>{success}</Text>
            </View>
          ) : (
            <Formik
              initialValues={{ 
                password: '',
                confirmPassword: ''
              }}
              validationSchema={resetPasswordSchema}
              onSubmit={handleResetPassword}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <>
                  <TextInput
                    label="كلمة المرور الجديدة"
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

                  <Button
                    mode="contained"
                    onPress={handleSubmit}
                    style={styles.button}
                    loading={isLoading}
                    disabled={isLoading || !!success}
                  >
                    تعيين كلمة المرور الجديدة
                  </Button>
                </>
              )}
            </Formik>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>تذكرت كلمة المرور؟ </Text>
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
    paddingHorizontal: 20,
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
  messageContainer: {
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  messageText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ResetPasswordScreen;
