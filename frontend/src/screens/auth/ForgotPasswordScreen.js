import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText } from 'react-native-paper';
import { Formik } from 'formik';
import * as yup from 'yup';
import axios from 'axios';
import { API_URL } from '../../config';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../config';

const forgotPasswordSchema = yup.object().shape({
  email: yup
    .string()
    .email(ERROR_MESSAGES.INVALID_EMAIL)
    .required(ERROR_MESSAGES.REQUIRED_FIELD),
});

const ForgotPasswordScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { colors } = useTheme();
  
  const handleForgotPassword = async (values, { resetForm }) => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, you would make an API call here
      // await axios.post(`${API_URL}/auth/forgot-password`, { email: values.email });
      
      setSuccess(SUCCESS_MESSAGES.RESET_EMAIL_SENT);
      resetForm();
    } catch (error) {
      console.error('Forgot password error:', error);
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
          <Text style={styles.title}>نسيت كلمة المرور</Text>
          <Text style={styles.subtitle}>أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور</Text>
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
          ) : null}

          <Formik
            initialValues={{ email: '' }}
            validationSchema={forgotPasswordSchema}
            onSubmit={handleForgotPassword}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <>
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

                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  style={styles.button}
                  loading={isLoading}
                  disabled={isLoading || !!success}
                >
                  إرسال رابط إعادة التعيين
                </Button>
              </>
            )}
          </Formik>

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

export default ForgotPasswordScreen;
