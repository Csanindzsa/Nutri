/**
 * Email service that uses EmailJS to send emails directly from frontend
 * without requiring a backend API
 */

// Configuration for EmailJS
const EMAILJS_SERVICE_ID = "service_nutri"; // Replace with your actual EmailJS service ID
const EMAILJS_TEMPLATE_ID = "template_nutriapp"; // Replace with your actual EmailJS template ID 
const EMAILJS_USER_ID = "YOUR_USER_ID"; // Replace with your actual EmailJS user ID
const SUPPORT_EMAIL = "support@nutriapp.example.com"; // Replace with the email you want to receive messages

/**
 * Email data structure
 */
export interface EmailData {
  subject: string;
  message: string;
  category: string;
  userName: string;
  userEmail: string;
  timestamp?: string;
}

/**
 * Send an email using EmailJS
 */
export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  // Load the EmailJS SDK dynamically
  if (!window.emailjs) {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";
    script.async = true;
    document.body.appendChild(script);
    
    // Wait for script to load
    await new Promise(resolve => {
      script.onload = resolve;
    });
    
    // Initialize EmailJS
    (window as any).emailjs.init(EMAILJS_USER_ID);
  }

  try {
    // Prepare template parameters based on your EmailJS template
    const templateParams = {
      to_email: SUPPORT_EMAIL,
      from_name: emailData.userName,
      from_email: emailData.userEmail,
      subject: `[${emailData.category}] ${emailData.subject}`,
      message: emailData.message,
      category: emailData.category,
      timestamp: emailData.timestamp || new Date().toISOString()
    };

    // Send the email using EmailJS
    const response = await (window as any).emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID, 
      templateParams
    );
    
    console.log('Email successfully sent!', response);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

// Declare global emailjs for TypeScript
declare global {
  interface Window {
    emailjs?: any;
  }
}
