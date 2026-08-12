import alertRepository from "../repository/alertRepository.js";
import userRepository from "../repository/userRepository.js";
import { sendPushNotification } from "../config/firebase.js";
import { sendSOSMessages } from "../config/twilio.js";
import { emitAlert } from "../socket/socketManager.js";
import AppError from "../utilis/appError.js";
import { sendSMS } from "../config/twilio.js";

class AlertService {

  //  determine severity from how far value exceeds threshold
  determineSeverity(metric, value, threshold, direction) {


    const percentageDeviation = Math.abs(
      ((value - threshold) / threshold) * 100
    );
   
    // e.g. heartRate 118 vs threshold 100 = 18% over

    // SpO2 below minimum is always critical — oxygen is life
    if (metric === "spO2" && direction === "low") {
      if (value < 90) return "critical";
      // below 90% = medical emergency
      if (value < 92) return "high";
      return "medium";
    }

   
    if (percentageDeviation > 30) return "critical";
   
    if (percentageDeviation > 20) return "high";
    if (percentageDeviation > 10) return "medium";
    return "low";
  }

  //  check readings against user's personal thresholds
  async checkAndCreateAlerts({ userId, readings, io }) {
  
       console.log("alertService: checking thresholds for user:", userId);
  console.log("alertService: readings received:", readings);
    const thresholds = await alertRepository.getOrCreateThresholds(userId);

    const alertsCreated = [];

    //  define which readings to check and against which thresholds
    const checks = [
      {
        metric: "heartRate",
        value: readings.heartRate,
        min: thresholds.heartRateMin,
        max: thresholds.heartRateMax,
      },
      {
        metric: "spO2",
        value: readings.spO2,
        min: thresholds.spO2Min,
        max: 100,
       
      },
      {
        metric: "bodyTemperature",
        value: readings.bodyTemperature,
        min: thresholds.bodyTemperatureMin,
        max: thresholds.bodyTemperatureMax,
      },
      {
        metric: "respiratoryRate",
        value: readings.respiratoryRate,
        min: thresholds.respiratoryRateMin,
        max: thresholds.respiratoryRateMax,
      },
      {
        metric: "roomHumidity",
        value: readings.roomHumidity,
        min: thresholds.roomHumidityMin,
        max: thresholds.roomHumidityMax,
      },
    ];

    for (const check of checks) {
      if (check.value === null || check.value === undefined) continue;
      // skip vitals that weren't included in this reading

      let breached = false;
      let direction = null;
      let thresholdValue = null;

      if (check.value < check.min) {
        breached = true;
        direction = "low";
        thresholdValue = check.min;
      } else if (check.value > check.max) {
        breached = true;
        direction = "high";
        thresholdValue = check.max;
      }

      if (!breached) continue;
      // no threshold crossed — check the next vital

      //  threshold breached — determine severity
      const severity = this.determineSeverity(
        check.metric, check.value, thresholdValue, direction
      );

      const message = `${this.formatMetricName(check.metric)} is ${direction === "high" ? "elevated" : "critically low"} at ${check.value} (threshold: ${thresholdValue})`;

      //  create alert record in the database
      const alert = await alertRepository.createAlert({
        userId,
        type: "threshold_breach",
        severity,
        metric: check.metric,
        value: check.value,
        threshold: thresholdValue,
        message,
        vitalsSnapshot: readings,
        
      });

      alertsCreated.push(alert);

      
      if (severity !== "low") {
        await this.fireNotifications({
          userId,
          alert,
          io,
        });
      }
    }

    return alertsCreated;
   
  }

  //  fire all notification channels 
async fireNotifications({ userId, alert, io }) {
  console.log("fireNotifications: starting for user:", userId);

  const user = await userRepository.findById(userId);
  if (!user) {
    console.log("fireNotifications: user not found — aborting");
    return;
  }
  console.log("fireNotifications: user found:", user.email);

  // ── FETCH CAREGIVERS HERE ─────────────────────────────────
  // caregivers must be fetched inside this method
  // they are NOT available from the outer scope
  // this was the bug — caregivers was referenced but never defined here
  const caregivers = await userRepository.findCaregivers(userId);
  console.log("fireNotifications: caregivers found:", caregivers.length);
  console.log("fireNotifications: caregiver phones:", caregivers.map(c => c.phoneNumber));

  const notificationTitle = alert.severity === "critical"
    ? "🚨 CRITICAL: VitalSync Alert"
    : "⚠️ VitalSync Alert";

  // ── 1. FCM push to patient's phone ───────────────────────
  const pushSent = await sendPushNotification({
    fcmToken: user.fcmToken,
    title: notificationTitle,
    body: alert.message,
    data: {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      metric: alert.metric,
    },
  });
  console.log("fireNotifications: FCM push sent:", pushSent);

  // ── 2. WebSocket emit to patient's app ────────────────────
  if (io) {
    emitAlert(io, userId, {
      alertId: alert.id,
      message: alert.message,
      severity: alert.severity,
      metric: alert.metric,
      value: alert.value,
      timestamp: alert.createdAt,
    });
    console.log("fireNotifications: WebSocket alert emitted");
  }

  // ── 3. SMS to caregivers 
  if (caregivers.length > 0) {
    console.log(`fireNotifications: sending SMS to ${caregivers.length} caregiver(s)`);

    const smsMessage = this.buildAlertSMS(user, alert);
    // build the SMS message

    const smsResults = await Promise.all(
      caregivers.map(async (caregiver) => {
        console.log(`fireNotifications: sending SMS to ${caregiver.phoneNumber}`);
        const sent = await sendSMS({
          to: caregiver.phoneNumber,
          message: smsMessage,
        });
        console.log(`fireNotifications: SMS to ${caregiver.phoneNumber} — ${sent ? "SUCCESS" : "FAILED"}`);
        return sent;
      })
    );

    const sentCount = smsResults.filter(Boolean).length;
    console.log(`fireNotifications: ${sentCount}/${caregivers.length} SMS sent`);

    // update the alert record with SMS status
    await alert.update({ smsSent: sentCount > 0 });
  } else {
    console.log("fireNotifications: no caregivers found — skipping SMS");
  }

  // update notification sent status
  await alert.update({ notificationSent: pushSent });
}

// ── build SMS message ─────────────────────────────────────────
// separate function keeps fireNotifications readable
buildAlertSMS(user, alert) {
  const time = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const severityEmoji = {
    critical: "🚨 CRITICAL",
    high: "⚠️ HIGH",
    medium: "⚡ ALERT",
    low: "ℹ️ NOTICE",
  }[alert.severity] ?? "⚠️ ALERT";

  return `${severityEmoji} - VitalSync Health Alert

Patient: ${user.name}
Time: ${time}

${alert.message}

${alert.vitalsSnapshot ? `Current readings:
Heart Rate: ${alert.vitalsSnapshot.heartRate ?? "N/A"} bpm
SpO2: ${alert.vitalsSnapshot.spO2 ?? "N/A"}%
Temperature: ${alert.vitalsSnapshot.bodyTemperature ?? "N/A"}°C` : ""}

Please check on your patient immediately.

- VitalSync Health Monitor`;
}

  //  SOS endpoint logic 
  async triggerSOS({ userId, currentVitals, io }) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    
    const caregivers = await userRepository.findCaregivers(userId);
   

    // create SOS alert record
    const alert = await alertRepository.createAlert({
      userId,
      type: "sos",
      severity: "critical",
      // SOS is always critical
      metric: null,
      // not triggered by a specific metric
      value: null,
      threshold: null,
      message: `Emergency SOS triggered by ${user.name}`,
      vitalsSnapshot: currentVitals,
      // snapshot of vitals at the moment SOS was pressed
    });

    // send all notifications simultaneously
    const [pushSent, smsResult] = await Promise.all([

      // push notification to the patient's own phone
      
      sendPushNotification({
        fcmToken: user.fcmToken,
        title: "🚨 SOS Activated",
        body: "Your emergency alert has been sent to your caregivers",
        data: { alertId: alert.id, type: "sos" },
      }),

      // SMS to all caregivers
      sendSOSMessages(caregivers, user, currentVitals),
      

      // WebSocket emit to any connected caregiver sessions
      Promise.resolve(
        io ? emitAlert(io, userId, {
          alertId: alert.id,
          type: "sos",
          severity: "critical",
          message: `🚨 ${user.name} has triggered an emergency SOS`,
          vitalsSnapshot: currentVitals,
          timestamp: new Date(),
        }) : null
      ),
    ]);

    //  update record with notification results
    await alert.update({
      notificationSent: pushSent,
      smsSent: smsResult.sent > 0,
    });

    return {
      alert,
      notifications: {
        pushSent,
        smsSent: smsResult.sent,
        smsFailed: smsResult.failed,
        caregiversNotified: smsResult.sent,
      },
    };
  }

  //  get alert history 
  async getAlertHistory(userId) {
    const alerts = await alertRepository.findAlertsByUserId(userId);
    return alerts;
  }

  //  acknowledge alert 
  async acknowledgeAlert(alertId, userId) {
    const alert = await alertRepository.acknowledgeAlert(alertId, userId);
    if (!alert) throw new AppError("Alert not found", 404);
    return alert;
  }

  //  update thresholds with validation to prevent dangerous settings
  async updateThresholds(userId, thresholdData) {
    // validate — prevent setting dangerous thresholds
    if (thresholdData.spO2Min && thresholdData.spO2Min < 85) {
      throw new AppError(
        "SpO2 minimum threshold cannot be set below 85% — this would be a medically dangerous setting",
        400
      );
    }

    if (thresholdData.heartRateMax && thresholdData.heartRateMax > 220) {
      throw new AppError("Heart rate maximum cannot exceed 220 bpm", 400);
    }

    const thresholds = await alertRepository.updateThresholds(userId, thresholdData);
    return thresholds;
  }

  async getThresholds(userId) {
    const thresholds = await alertRepository.getOrCreateThresholds(userId);
    return thresholds;
  }

  
  formatMetricName(metric) {
    const names = {
      heartRate: "Heart rate",
      spO2: "Blood oxygen (SpO2)",
      bodyTemperature: "Body temperature",
      respiratoryRate: "Respiratory rate",
      roomHumidity: "Room humidity",
    };
    return names[metric] || metric;
  }
}

export default new AlertService();