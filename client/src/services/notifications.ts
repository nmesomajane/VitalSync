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

  
  if (!Device.isDevice) {
    console.log("Notifications: not a real device — skipping");
    return false;
  
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
    importance: Notifications.AndroidImportance.MAX,
    
    sound: "alarm.mp3",
    vibrationPattern: [0, 400, 200, 400, 200, 400],
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
  });

  await Notifications.setNotificationChannelAsync("alerts", {
    name: "Health Alerts",
    importance: Notifications.AndroidImportance.MAX,
    sound: "alarm.mp3",
    vibrationPattern: [0, 500, 200, 500, 200, 500, 200, 500],
    // four pulses for alerts — more urgent than medication
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
  });
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
): Promise<string | null> => {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return null;

  const [hours, minutes] = time.split(":").map(Number);

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: "💊 Medication Reminder",
      body: `Time to take ${medicationName} — ${dosage}`,
      sound: "alarm.mp3",
      // plays your custom alarm sound
      data: {
        type: "medication",
        medicationId,
        medicationName,
        dosage,
      },
      priority: Notifications.AndroidNotificationPriority.MAX,
    
      sticky: false,
     
    },
    trigger: {
      hour: hours,
      minute: minutes,
      repeats: true,
      channelId: "medications",
      // channelId links to the Android channel with our alarm sound
      // without this, Android ignores the sound setting
    },
  });

  console.log(`Medication reminder scheduled: ${medicationName} at ${time}`);
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
      
    });

    console.log("Push token:", tokenData.data);
    return tokenData.data;
    

  } catch (err) {
    console.error("Failed to get push token:", err);
    return null;
  }
};

