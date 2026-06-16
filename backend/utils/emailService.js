const nodemailer = require("nodemailer");
const { env } = require("../config/env");
const { DEFAULT_FROM_NAME } = require("../config/constants");

// Initialize test account and transporter globally so we don't recreate it every time
let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: {
        user: env.SMTP_EMAIL,
        pass: env.SMTP_PASSWORD,
      },
    });
  } else {
    // Use Ethereal Email for testing (catches emails and provides a link to view them)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, 
        pass: testAccount.pass, 
      },
    });
    console.log(`⚠️ Using Ethereal Mock Email Service. Account: ${testAccount.user}`);
  }

  return transporter;
};

/**
 * Send an email alert for a newly published event
 * @param {Array<String>} toEmails - Array of recipient email addresses
 * @param {Object} event - The event object
 */
const sendEventAlerts = async (toEmails, event) => {
  if (!toEmails || toEmails.length === 0) return;

  try {
    const tp = await getTransporter();

    // Format the date nicely
    const eventDate = new Date(event.date).toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });

    // Create the email content
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #3b82f6; padding: 20px; text-align: center; color: white;">
          <h2 style="margin: 0;">New Event Alert: ${event.department}</h2>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <h3 style="color: #1e293b; margin-top: 0;">${event.title}</h3>
          <p style="color: #475569; font-size: 16px; line-height: 1.5;">${event.description}</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #334155;"><strong>Date:</strong> ${eventDate} at ${event.time}</p>
            <p style="margin: 5px 0; color: #334155;"><strong>Venue:</strong> ${event.venue}</p>
            <p style="margin: 5px 0; color: #334155;"><strong>Speaker:</strong> ${event.speaker}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${env.FRONTEND_BASE_URL}/events/${event._id}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">View Event Details</a>
          </div>
        </div>
        <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
          You received this email because you are subscribed to subjects related to this event.
        </div>
      </div>
    `;

    // Send the email (using bcc to protect privacy when sending to multiple users)
    const info = await tp.sendMail({
      from: `"${DEFAULT_FROM_NAME}" <${env.SMTP_EMAIL || 'alerts@academicevents.local'}>`,
      to: '"Subscribed Users" <undisclosed-recipients@local>',
      bcc: toEmails,
      subject: `New Event: ${event.title}`,
      html: htmlContent,
    });

    console.log("-----------------------------------------");
    console.log(`✉️ Email alerts sent to ${toEmails.length} users!`);
    console.log(`✉️ Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    console.log("-----------------------------------------");

    return info;
  } catch (error) {
    console.error("Error sending email alerts:", error);
  }
};

/**
 * Send an email confirming a user's registration for an event
 * @param {String} userEmail - The user's email address
 * @param {String} userName - The user's full name
 * @param {Object} event - The event object
 */
const sendRegistrationEmail = async (userEmail, userName, event) => {
  if (!userEmail) return;

  try {
    // If SMTP_HOST is provided, use the generic sendEmail wrapper, otherwise use local Ethereal
    // Wait, the generic sendEmail creates its own transporter. But we can just use the existing logic here!
    const tp = await getTransporter();

    const eventDate = new Date(event.date).toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #10b981; padding: 20px; text-align: center; color: white;">
          <h2 style="margin: 0;">Registration Confirmed! 🎉</h2>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <p style="color: #334155; font-size: 16px;">Hi <strong>${userName}</strong>,</p>
          <p style="color: #475569; font-size: 16px; line-height: 1.5;">You have successfully registered for the following event:</p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">${event.title}</h3>
            <p style="margin: 5px 0; color: #334155;"><strong>Date:</strong> ${eventDate}</p>
            <p style="margin: 5px 0; color: #334155;"><strong>Time:</strong> ${event.time}</p>
            <p style="margin: 5px 0; color: #334155;"><strong>Venue:</strong> ${event.venue}</p>
          </div>
          
          <p style="color: #475569; font-size: 14px;">Please mark your calendar. We look forward to seeing you there!</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${env.FRONTEND_BASE_URL}/student/calendar" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">View My Calendar</a>
          </div>
        </div>
        <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
          Academic Events Hub - Automatically generated email.
        </div>
      </div>
    `;

    const info = await tp.sendMail({
      from: `"${DEFAULT_FROM_NAME}" <${env.SMTP_EMAIL || 'alerts@academicevents.local'}>`,
      to: userEmail,
      subject: `Registration Confirmed: ${event.title}`,
      html: htmlContent,
    });

    console.log("-----------------------------------------");
    console.log(`✉️ Registration confirmation sent to ${userEmail}!`);
    console.log(`✉️ Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    console.log("-----------------------------------------");

    return info;
  } catch (error) {
    console.error("Error sending registration email:", error);
  }
};

module.exports = { sendEventAlerts, sendRegistrationEmail };
