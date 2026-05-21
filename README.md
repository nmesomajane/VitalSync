# VitalSync
## Real-Time IoT Health Monitoring — From Sensor to Smartphone
> *Your health, always in sync.*


VitalSync connects wearable hardware directly to a mobile app streaming live vitals, detecting anomalies the moment they happen, and alerting caregivers before a situation becomes an emergency.
 
Built as a final year Electronic Engineering project at FUTO.

## What It Does

A patient wears the VitalSync hardware device. Every 2 seconds, it captures their vitals and sends them to the cloud. Their phone updates instantly. If anything looks wrong, their doctor gets a text message


## Features That Matter

**Live Streaming**
Vitals appear on the app the moment the sensor reads them — powered by WebSocket, not polling. No refresh button. No waiting.
 
**Intelligent Alerts**
Every reading is checked against medical thresholds.The threshold aren't fixed , the can be updated. Alerts are classified by severity  low, medium, high, and critical so you're not woken up at 2am for a minor humidity change.
 
**Emergency SOS**
One button. Sends an SMS to every linked caregiver simultaneously with the patient's name, current vitals, and timestamp. Uses Twilio delivered in seconds.
 
**Caregiver Sharing**
Share a live read-only link with a doctor or family member. No account needed. They open the link and see real-time vitals. Link expires in 7 days and can be revoked instantly.
 
**AI Health Insights**
The last 7 days of vitals are sent to Gemini AI which returns a personalised meal plan and daily routine  not generic advice, but recommendations based on your actual readings.
 
**30-Day History** 
Every reading is stored and aggregated by day. See trends, spot patterns, and export a PDF health report to share with your doctor.That way accurate information are give instead of users/patient giving a guess information.


## Tech Stack

```
Backend          Node.js · Express · PostgreSQL · Sequelize · Socket.io
Auth             JWT · bcrypt (12 rounds) · Google OAuth 2.0 · Passport.js
Notifications    Firebase Cloud Messaging · Twilio SMS
AI               Google Gemini API · YouTube Data API v3
Mobile App       React Native · Expo · NativeWind · Victory Native
```

 
## Author
 
**Nmesoma** — Electronic Engineering, FUTO  
Building at the intersection of embedded systems and health technology.

 
*This project is open source for educational purposes. Not a substitute for medical advice.*
