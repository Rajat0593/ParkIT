import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import useAuthStore from '../../store/authStore';

const registerSchema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone number is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  userType: yup
    .string()
    .oneOf(['car_owner', 'space_provider'])
    .required('Please select user type'),
});

export default function RegisterScreen({ navigation }) {
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [confirmSecureTextEntry, setConfirmSecureTextEntry] = useState(true);
  const { register, isLoading, error, clearError } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      userType: 'car_owner',
    },
  });

  const onRegister = async (data) => {
    try {
      clearError();
      const { confirmPassword, ...registerData } = data;
      await register(registerData);
      navigation.navigate('OTPVerification', { email: data.email });
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join ParkIT today</Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="First Name"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                error={!!errors.firstName}
                style={styles.input}
              />
            )}
          />
          {errors.firstName && (
            <HelperText type="error">{errors.firstName.message}</HelperText>
          )}

          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Last Name"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                error={!!errors.lastName}
                style={styles.input}
              />
            )}
          />
          {errors.lastName && (
            <HelperText type="error">{errors.lastName.message}</HelperText>
          )}

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Email"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!errors.email}
                style={styles.input}
              />
            )}
          />
          {errors.email && (
            <HelperText type="error">{errors.email.message}</HelperText>
          )}

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Phone Number"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                keyboardType="phone-pad"
                error={!!errors.phone}
                style={styles.input}
              />
            )}
          />
          {errors.phone && (
            <HelperText type="error">{errors.phone.message}</HelperText>
          )}

          <Controller
            control={control}
            name="userType"
            render={({ field: { onChange, value } }) => (
              <View style={styles.userTypeContainer}>
                <Text style={styles.userTypeLabel}>I am a:</Text>
                <View style={styles.userTypeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.userTypeButton,
                      value === 'car_owner' && styles.userTypeButtonActive,
                    ]}
                    onPress={() => onChange('car_owner')}
                  >
                    <Text
                      style={[
                        styles.userTypeButtonText,
                        value === 'car_owner' &&
                          styles.userTypeButtonTextActive,
                      ]}
                    >
                      Car Owner
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.userTypeButton,
                      value === 'space_provider' &&
                        styles.userTypeButtonActive,
                    ]}
                    onPress={() => onChange('space_provider')}
                  >
                    <Text
                      style={[
                        styles.userTypeButtonText,
                        value === 'space_provider' &&
                          styles.userTypeButtonTextActive,
                      ]}
                    >
                      Space Provider
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.userType && (
                  <HelperText type="error">{errors.userType.message}</HelperText>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Password"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                secureTextEntry={secureTextEntry}
                autoCapitalize="none"
                error={!!errors.password}
                style={styles.input}
                right={
                  <TextInput.Icon
                    icon={secureTextEntry ? 'eye' : 'eye-off'}
                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                  />
                }
              />
            )}
          />
          {errors.password && (
            <HelperText type="error">{errors.password.message}</HelperText>
          )}

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Confirm Password"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                secureTextEntry={confirmSecureTextEntry}
                autoCapitalize="none"
                error={!!errors.confirmPassword}
                style={styles.input}
                right={
                  <TextInput.Icon
                    icon={confirmSecureTextEntry ? 'eye' : 'eye-off'}
                    onPress={() =>
                      setConfirmSecureTextEntry(!confirmSecureTextEntry)
                    }
                  />
                }
              />
            )}
          />
          {errors.confirmPassword && (
            <HelperText type="error">{errors.confirmPassword.message}</HelperText>
          )}

          {error && <HelperText type="error">{error}</HelperText>}

          <Button
            mode="contained"
            onPress={handleSubmit(onRegister)}
            style={styles.button}
            disabled={isLoading}
            contentStyle={styles.buttonContent}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : 'Sign Up'}
          </Button>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  userTypeContainer: {
    marginBottom: 16,
  },
  userTypeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  userTypeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  userTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  userTypeButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  userTypeButtonText: {
    color: '#666',
    fontSize: 14,
  },
  userTypeButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 16,
  },
  buttonContent: {
    paddingVertical: 12,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
