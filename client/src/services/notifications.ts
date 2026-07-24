import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";

// this configures HOW notifications appear when they arrive

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

//  request permission 
export const requestNotificationPermission = async (): Promise<boolean> => {
  // notifications require explicit user permission on both iOS and Android
  
  if (!Device.isDevice) {
    console.log("Notifications: not a real device — skipping");
    return false;
    // notifications don't work in emulator for scheduling
    // works on real physical device
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  // check if permission was already granted

  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    // shows the system permission dialog to the user
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Notifications: permission denied by user");
    return false;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("medications", {
      name: "Medication Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      // HIGH = makes sound and appears as heads-up notification
      // this is what makes it appear even when phone screen is off
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
      // vibrate pattern: wait 0ms, vibrate 250ms, wait 250ms, vibrate 250ms
    });

    await Notifications.setNotificationChannelAsync("alerts", {
      name: "Health Alerts",
      importance: Notifications.AndroidImportance.MAX,
      // MAX = highest priority — overrides do-not-disturb
      sound: "default",
      vibrationPattern: [0, 500, 200, 500, 200, 500],
    });
    // Android requires notification channels since Android 8
    // without a channel, notifications are silently dropped
  }

  console.log("Notifications: permission granted");
  return true;
};

//  schedule medication reminder 
export const scheduleMedicationReminder = async (
  medicationId: string,
  medicationName: string,
  dosage: string,
  time: string
  // time = "HH:MM" format e.g. "08:00"
): Promise<string | null> => {
  // returns the notification identifier — save this to cancel later

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return null;

  const [hours, minutes] = time.split(":").map(Number);
  // split "08:00" into [8, 0]
  // .map(Number) converts string "8" to number 8

  // schedule a repeating daily notification at the specified time
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: "💊 Medication Reminder",
      body: `Time to take ${medicationName} — ${dosage}`,
      data: {
        type: "medication",
        medicationId,
        // data is available when user taps the notification
        // use this to navigate to the right screen
      },
      sound: "default",
      categoryIdentifier: "medications",
      // links to the Android notification channel
    },
    trigger: {
      type: "daily",
      hour: hours,
      minute: minutes,
      // fires every day at this time
      // this is what makes it a daily alarm
    },
  });

  console.log(
    `Notifications: scheduled ${medicationName} at ${time} — id: ${identifier}`
  );
  return identifier;
};

//   cancel a medication reminder 
export const cancelMedicationReminder = async (
  notificationId: string
): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync      (notificationId);
  console.log("Notifications: cancelled reminder:", notificationId);
};

// cancel all reminders for an app reset 
export const cancelAllReminders = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

//  listen for notification taps 
// call this once in _layout.tsx
export const setupNotificationListeners = (
  onMedicationTap: (medicationId: string) => void,
  onAlertTap: () => void
) => {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      // fires when user TAPS the notification
      // response.notification.request.content.data = the data we passed
      const data = response.notification.request.content.data as any;

      console.log("Notification tapped:", data);

      if (data?.type === "medication") {
        onMedicationTap(data.medicationId);
        // navigate to profile/medications
      } else if (data?.type === "alert") {
        onAlertTap();
        // navigate to history/alerts
      }
    }
  );

  return () => subscription.remove();

};

export const registerForPushNotifications = async (): Promise<string | null> => {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return null;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
      // projectId from your app.json/app.config.js
      // needed for Expo's push notification service
    });

    console.log("Push token:", tokenData.data);
    return tokenData.data;
    

  } catch (err) {
    console.error("Failed to get push token:", err);
    return null;
  }
};