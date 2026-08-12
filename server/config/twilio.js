import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

let twilioClient;

const getTwilioClient = () => {
 
  if (twilioClient) return twilioClient;

     console.log("Twilio config check:", {
    hasSID: !!process.env.TWILIO_ACCOUNT_SID,
    hasToken: !!process.env.TWILIO_AUTH_TOKEN,
    hasPhone: !!process.env.TWILIO_PHONE_NUMBER,
    SIDprefix: process.env.TWILIO_ACCOUNT_SID?.substring(0, 6),
  
  });


  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.warn("Twilio credentials missing — SMS disabled");
    return null;
    // graceful degradation — app works without Twilio
    
  }

  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
    // these two values authenticate your server with Twilio
  
  );

  return twilioClient;
};

export const sendSMS = async ({ to, message }) => {


  const client = getTwilioClient();

  if (!client) {
    console.log("Twilio not configured — SMS not sent");
    return false;
  }

  if (!to || !to.startsWith("+")) {
    console.warn(`Invalid phone number format: ${to}`);
  
    return false;
  }

  try {
    const result = await client.messages.create({
      body: message,
  
      from: process.env.TWILIO_PHONE_NUMBER,
    
      to,
      // recipient's phone number
    });

    console.log(`SMS sent to ${to}:`, result.sid);

    return true;

  } catch (error) {
    console.error(`SMS to ${to} failed:`, error.message);
 
    return false;
  }
};

export const sendSOSMessages = async (caregivers, patient, vitals) => {


  if (!caregivers || caregivers.length === 0) {
    console.log("No caregivers to notify");
    return { sent: 0, failed: 0 };
  }

  const message = buildSOSMessage(patient, vitals);
  // build the message once, send to all caregivers

  const results = await Promise.all(
    caregivers.map(caregiver =>
      sendSMS({ to: caregiver.phoneNumber, message })
    
    )
  );

  const sent = results.filter(Boolean).length;
 
  const failed = results.filter(r => !r).length;
 

  return { sent, failed };
};

const buildSOSMessage = (patient, vitals) => {
 

  const time = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  });

  return ` VITALSYNC EMERGENCY ALERT

Patient: ${patient.name}
Time: ${time}

Current Vitals:
Heart Rate: ${vitals.heartRate ?? "N/A"} bpm
SpO2: ${vitals.spO2 ?? "N/A"}%
Temperature: ${vitals.bodyTemperature ?? "N/A"}°C
Respiratory: ${vitals.respiratoryRate ?? "N/A"}/min

${patient.name} has triggered an emergency SOS. Please check on them immediately.

VitalSync Health Monitor`;
};