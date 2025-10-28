const nodemailer = require('nodemailer');

// Configure the transporter using environment variables
const transporter = nodemailer.createTransport({
  // Example for Gmail - replace with your service's config
  service: 'gmail', // Or use host/port for other services
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Add secure: true for production with services like SendGrid/Mailgun
});

// Verify connection configuration (optional, runs on server start)
transporter.verify(function(error, success) {
  if (error) {
    console.error("Nodemailer configuration error:", error);
  } else {
    console.log("Nodemailer is ready to send emails");
  }
});

const sendPasswordResetEmail = async (toEmail, resetLink) => {
  const mailOptions = {
    from: `"Invoice App" <${process.env.EMAIL_USER}>`, // sender address
    to: toEmail, // list of receivers
    subject: "Reset Your Invoice App Password", // Subject line
    text: `You requested a password reset. Click this link to reset your password: ${resetLink} \n\nIf you did not request this, please ignore this email. This link will expire in 1 hour.`, // plain text body
    html: `<p>You requested a password reset for your Invoice App account.</p>
           <p>Click the link below to set a new password:</p>
           <a href="${resetLink}" target="_blank">${resetLink}</a>
           <p>If you did not request this, please ignore this email. This link will expire in 1 hour.</p>`, // html body
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return false;
  }
};

module.exports = { sendPasswordResetEmail };