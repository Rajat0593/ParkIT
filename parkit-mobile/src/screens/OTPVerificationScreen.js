import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import useAuthStore from '../store/authStore';

export default function OTPVerificationScreen({ navigation, route }) {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const { email } = route.params;
  const { verifyOTP, resendOTP } = useAuthStore();

  useEffect(() => {
    let interval;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await verifyOTP(email, otp);
      setSuccess('Email verified successfully!');
      setTimeout(() => {
        navigation.navigate('Login');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setIsLoading(true);
    setError('');
    try {
      await resendOTP(email);
      setSuccess('OTP resent successfully!');
      setCountdown(30);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit OTP to {email}
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Enter OTP"
            value={otp}
            onChangeText={setOtp}
            mode="outlined"
            keyboardType="number-pad"
            maxLength={6}
            style={styles.otpInput}
            textAlign="center"
            fontSize={24}
            error={!!error}
          />

          {error && <HelperText type="error">{error}</HelperText>}
          {success && <HelperText type="success">{success}</HelperText>}

          <Button
            mode="contained"
            onPress={handleVerifyOTP}
            style={styles.button}
            disabled={isLoading || otp.length !== 6}
            contentStyle={styles.buttonContent}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : 'Verify OTP'}
          </Button>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive OTP? </Text>
            <TouchableOpacity
              onPress={handleResendOTP}
              disabled={countdown > 0 || isLoading}
            >
              <Text
                style={[
                  styles.resendLink,
                  (countdown > 0 || isLoading) && styles.resendLinkDisabled,
                ]}
              >
                {countdown > 0
                  ? `Resend in ${countdown}s`
                  : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.changeEmailContainer}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.changeEmailText}>Change Email Address</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  otpInput: {
    backgroundColor: '#fff',
    marginBottom: 16,
    height: 60,
  },
  button: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonContent: {
    paddingVertical: 12,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resendText: {
    color: '#666',
    fontSize: 14,
  },
  resendLink: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resendLinkDisabled: {
    color: '#ccc',
  },
  changeEmailContainer: {
    alignItems: 'center',
  },
  changeEmailText: {
    color: '#666',
    fontSize: 14,
  },
});
