import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import useAuthStore from '../../store/authStore';

const loginSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

export default function LoginScreen({ navigation }) {
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const { login, isLoading, error, clearError } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onLogin = async (data) => {
    try {
      clearError();
      await login(data);
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome to ParkIT</Text>
          <Text style={styles.subtitle}>Find your perfect parking spot</Text>
        </View>

        <View style={styles.form}>
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

          {error && <HelperText type="error">{error}</HelperText>}

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            mode="contained"
            onPress={handleSubmit(onLogin)}
            style={styles.button}
            disabled={isLoading}
            contentStyle={styles.buttonContent}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : 'Login'}
          </Button>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Sign Up</Text>
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
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#4A90E2',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonContent: {
    paddingVertical: 12,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: '#666',
    fontSize: 14,
  },
  registerLink: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
