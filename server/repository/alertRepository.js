import Alert from "../models/alert.js";
import Threshold from "../models/threshold.js";

class AlertRepository {

  async createAlert(alertData) {
    const alert = await Alert.create(alertData);
  
    return alert;
  }

  async findAlertsByUserId(userId, limit = 20) {
    const alerts = await Alert.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      
      limit,
     
    });
    return alerts;
  }

  async acknowledgeAlert(alertId, userId) {
    const alert = await Alert.findOne({
      where: { id: alertId, userId },
     
    });

    if (!alert) return null;

    await alert.update({
      acknowledged: true,
      acknowledgedAt: new Date(),
    });

    return alert;
  }

  async getOrCreateThresholds(userId) {
    const [thresholds, created] = await Threshold.findOrCreate({
      where: { userId },
      
      defaults: { userId },
     
    });

    if (created) {
      console.log(`Default thresholds created for user ${userId}`);
    }

    return thresholds;
  }

  async updateThresholds(userId, thresholdData) {
    const thresholds = await this.getOrCreateThresholds(userId);
   

    await thresholds.update(thresholdData);
    

    return thresholds;
  }
}

export default new AlertRepository();