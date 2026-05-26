import cron from "node-cron";
import medicationRepository from "../repository/medicationRepository.js";
import userRepository from "../repository/userRepository.js";
import { sendPushNotification } from "../config/firebase.js";
import AppError from "../utilis/appError.js";

class MedicationService {

  async addMedication(userId, medicationData) {
    const { name, dosage, frequency, scheduledTimes } = medicationData;

    if (!name || !dosage || !frequency) {
      throw new AppError("Name, dosage, and frequency are required", 400);
    }

    if (!scheduledTimes || scheduledTimes.length === 0) {
      throw new AppError(
        "At least one scheduled time is required e.g. ['08:00', '20:00']",
        400
      );
    }

    // validate time format — must be HH:MM
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    for (const time of scheduledTimes) {
      if (!timeRegex.test(time)) {
        throw new AppError(
          `Invalid time format: ${time}. Use HH:MM format e.g. "08:00"`,
          400
        );
      }
    }

    // validate frequency matches number of times
    const frequencyTimeCounts = {
      once_daily: 1,
      twice_daily: 2,
      three_times_daily: 3,
      weekly: 1,
      as_needed: null,
      // null = any number of times is fine
    };

    const expectedCount = frequencyTimeCounts[frequency];
    if (expectedCount && scheduledTimes.length !== expectedCount) {
      throw new AppError(
        `${frequency} requires exactly ${expectedCount} scheduled time(s). You provided ${scheduledTimes.length}.`,
        400
      );
    }

    return await medicationRepository.createMedication({
      userId,
      name,
      dosage,
      frequency,
      scheduledTimes,
      startDate: medicationData.startDate || new Date(),
      endDate: medicationData.endDate || null,
      notes: medicationData.notes || null,
      color: medicationData.color || null,
      reminderEnabled: medicationData.reminderEnabled ?? true,
    });
  }

  async getMedications(userId) {
    return await medicationRepository.findMedicationsByUserId(userId);
  }

  async updateMedication(medicationId, userId, updateData) {
    const medication = await medicationRepository.updateMedication(
      medicationId, userId, updateData
    );
    if (!medication) throw new AppError("Medication not found", 404);
    return medication;
  }

  async deleteMedication(medicationId, userId) {
    const deleted = await medicationRepository.deleteMedication(medicationId, userId);
    if (!deleted) throw new AppError("Medication not found", 404);
    return { message: "Medication deleted successfully" };
  }

  async toggleReminder(medicationId, userId) {
    const medication = await medicationRepository.findMedicationById(
      medicationId, userId
    );
    if (!medication) throw new AppError("Medication not found", 404);

    await medication.update({
      reminderEnabled: !medication.reminderEnabled,
    });
    return medication;
  }

  // cron job — runs every minute 
  // checks if any medication is due right now
  // fires push notification if so

  startMedicationReminders() {
    cron.schedule("* * * * *", async () => {
 

      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
     

      try {
        const allMedications = await medicationRepository.findAllActiveForCron();
        

        for (const medication of allMedications) {
          if (medication.scheduledTimes.includes(currentTime)) {
            

            const user = await userRepository.findById(medication.userId);

            if (user?.fcmToken) {
              await sendPushNotification({
                fcmToken: user.fcmToken,
                title: "💊 Medication Reminder",
                body: `Time to take your ${medication.name} — ${medication.dosage}`,
                data: {
                  type: "medication_reminder",
                  medicationId: medication.id,
                  medicationName: medication.name,
                  dosage: medication.dosage,
                  scheduledTime: currentTime,
                },
              });

              console.log(
                `Reminder sent: ${medication.name} for user ${medication.userId} at ${currentTime}`
              );
            }
          }
        }
      } catch (error) {
        console.error("Medication cron error:", error.message);
       
      }
    });

    console.log("Medication reminder cron job started");
  }
}

export default new MedicationService();