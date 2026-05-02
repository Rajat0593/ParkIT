const nodemailer = require('nodemailer');
const config = require('../config/environment');
const logger = require('../utils/logger');

// Create email transporter
const transporter = nodemailer.createTransport({
  host: config.EMAIL.HOST,
  port: config.EMAIL.PORT,
  secure: config.EMAIL.PORT === 465,
  auth: {
    user: config.EMAIL.USER,
    pass: config.EMAIL.PASSWORD
  }
});

// Verify transporter connection (optional, for debugging)
const verifyConnection = async () => {
  try {
    await transporter.verify();
    logger.info('Email transporter verified successfully');
  } catch (error) {
    logger.warn('Email transporter verification failed:', { error: error.message });
  }
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: config.EMAIL.FROM,
      to: email,
      subject: 'Your ParkIT OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: white; border-radius: 8px; padding: 30px; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #333; text-align: center;">ParkIT</h2>
            <p style="color: #666; text-align: center; font-size: 16px;">Your OTP Code</p>
            <div style="background-color: #f0f0f0; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #007bff; letter-spacing: 5px; margin: 0;">${otp}</h1>
            </div>
            <p style="color: #999; text-align: center; font-size: 12px;">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; text-align: center; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`OTP email sent to ${email}`);
    return true;
  } catch (error) {
    logger.error('Failed to send OTP email', { email, error: error.message });
    return false;
  }
};

// Send booking confirmation email
const sendBookingConfirmationEmail = async (email, bookingDetails) => {
  try {
    const mailOptions = {
      from: config.EMAIL.FROM,
      to: email,
      subject: `Booking Confirmed - ${bookingDetails.bookingId}`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: white; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; text-align: center;">Booking Confirmed</h2>
            <h3 style="color: #007bff; margin-top: 20px;">Booking Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Booking ID:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${bookingDetails.bookingId}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Space:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${bookingDetails.spaceName}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Check-in:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${bookingDetails.checkInDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Check-out:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${bookingDetails.checkOutDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Total Price:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>₹${bookingDetails.totalPrice}</strong></td>
              </tr>
            </table>
            <a href="${config.API_BASE_URL}/bookings/${bookingDetails.bookingId}" style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px;">View Booking</a>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Booking confirmation email sent to ${email}`);
    return true;
  } catch (error) {
    logger.error('Failed to send booking email', { email, error: error.message });
    return false;
  }
};

// Send generic email
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: config.EMAIL.FROM,
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to}`);
    return true;
  } catch (error) {
    logger.error('Failed to send email', { to, subject, error: error.message });
    return false;
  }
};

module.exports = {
  verifyConnection,
  sendOTPEmail,
  sendBookingConfirmationEmail,
  sendEmail,
  transporter
};
