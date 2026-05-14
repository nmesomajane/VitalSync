import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));


let firebaseApp;

const initializeFirebase = () => {
  if (firebaseApp) return firebaseApp;

  try {
    const serviceAccount = JSON.parse(
      readFileSync(join(__dirname, "../serviceAccountKey.json"), "utf8")
    );
 

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),

    });

    console.log("Firebase Admin initialised");
    return firebaseApp;

  } catch (error) {
    console.error("Firebase initialisation failed:", error.message);
    
    return null;
  }
};

export const sendPushNotification = async ({ fcmToken, title, body, data = {} }) => {
  

  if (!firebaseApp) initializeFirebase();

  if (!fcmToken) {
    console.log("No FCM token for user — skipping push notification");
    return false;
  
  }

  try {
    const message = {
      token: fcmToken,
    

      notification: {
        title,
        body,
       
      },

      data: {
        ...data,
        
      
        timestamp: new Date().toISOString(),
      },

      android: {
        priority: "high",
        
        notification: {
          sound: "alarm",
          
          channelId: "vitalsync_alerts",
         
        },
      },

      apns: {
       
        payload: {
          aps: {
            sound: "alarm.wav",
            badge: 1,
          
            contentAvailable: true,
           
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    // sends the notification via Firebase infrastructure
    // response contains a message ID confirming delivery

    console.log("Push notification sent:", response);
    return true;

  } catch (error) {
    console.error("Push notification failed:", error.message);
    // common errors:
    // "registration-token-not-registered" → user uninstalled app
    // "invalid-argument" → malformed FCM token
    return false;
  }
};

export { initializeFirebase };