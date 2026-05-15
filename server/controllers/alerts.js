import alertService from "../services/alertService.js";
import asyncHandler from "../utilis/asyncHandler.js";

// GET /api/v1/alerts — alert history
export const getAlerts = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const alerts = await alertService.getAlertHistory(userId);

  res.status(200).json({
    success: true,
    count: alerts.length,
    data: alerts,
  });
});

// PUT /api/v1/alerts/:id/acknowledge — mark alert as read
export const acknowledgeAlert = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const { id: alertId } = req.params;


  const alert = await alertService.acknowledgeAlert(alertId, userId);

  res.status(200).json({
    success: true,
    message: "Alert acknowledged",
    data: alert,
  });
});

// GET /api/v1/alerts/thresholds — get user's thresholds
export const getThresholds = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const thresholds = await alertService.getThresholds(userId);

  res.status(200).json({
    success: true,
    data: thresholds,
  });
});

// PUT /api/v1/alerts/thresholds — update thresholds
export const updateThresholds = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const thresholds = await alertService.updateThresholds(userId, req.body);

  res.status(200).json({
    success: true,
    message: "Thresholds updated successfully",
    data: thresholds,
  });
});

// POST /api/v1/alerts/sos — emergency SOS
export const triggerSOS = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const io = req.app.get("io");

  const { currentVitals } = req.body;
  

  const result = await alertService.triggerSOS({
    userId,
    currentVitals,
    io,
  });

  res.status(200).json({
    success: true,
    message: "Emergency SOS sent to all caregivers",
    data: result,
  });
});

// POST /api/v1/alerts/fcm-token — app sends its FCM token after login
export const updateFCMToken = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const { fcmToken } = req.body;

  if (!fcmToken) {
    return res.status(400).json({
      success: false,
      message: "FCM token is required",
    });
  }

  await userRepository.updateById(userId, { fcmToken });


  res.status(200).json({
    success: true,
    message: "Device token registered for notifications",
  });
});