import vitalsRepository from "../repository/vitalRepository.js";
import AppError from "../utilis/appError.js";
import { emitVitalsUpdate, emitAlert } from "../socket/socketManager.js";

//  Define thresholds 

const DEFAULT_THRESHOLDS = {
  heartRate: {
    min: 60,
    max: 100,
    // below 60 bpm = bradycardia
    // above 100 bpm = tachycardia
    unit: "bpm",
  },
  spO2: {
    min: 94,
    max: 100,
    // below 94% is clinically concerning
    // requires immediate attention below 90%
    unit: "%",
  },
  bodyTemperature: {
    min: 36.1,
    max: 37.5,
    // below 36.1 = hypothermia risk
    // above 37.5 = fever
    unit: "°C",
  },
  respiratoryRate: {
    min: 12,
    max: 20,
    // below 12 = bradypnea
    // above 20 = tachypnea (can indicate respiratory distress)
    unit: "/min",
  },
  roomHumidity: {
    min: 30,
    max: 70,
    // outside this range affects breathing comfort
    // not medically critical but worth flagging
    unit: "%",
  },
};

//  Health score weights


const HEALTH_SCORE_WEIGHTS = {
  heartRate: 0.30,        
  spO2: 0.30,            
  bodyTemperature: 0.20,  
  respiratoryRate: 0.15,  
  roomHumidity: 0.05,     
};

class VitalsService {

  //  STEP 3C — Check thresholds


  checkThresholds(readings) {
    const anomalies = {};


    for (const [metric, threshold] of Object.entries(DEFAULT_THRESHOLDS)) {
     

      const value = readings[metric];
  

      if (value === null || value === undefined) continue;
     

      if (value < threshold.min) {
        anomalies[metric] = {
          value,
          threshold: threshold.min,
          status: "low",
       
          message: `${metric} is critically low at ${value}${threshold.unit}`,
        };
      } else if (value > threshold.max) {
        anomalies[metric] = {
          value,
          threshold: threshold.max,
          status: "high",
         
          message: `${metric} is elevated at ${value}${threshold.unit}`,
        };
      }
    
    }

    return anomalies;
  
  }

  // STEP 3D — Calculate health score 


  calculateHealthScore(readings) {
    let score = 0;
    let totalWeight = 0;

    for (const [metric, weight] of Object.entries(HEALTH_SCORE_WEIGHTS)) {
      const value = readings[metric];
      const threshold = DEFAULT_THRESHOLDS[metric];

      if (value === null || value === undefined) continue;
    

      const range = threshold.max - threshold.min;
     

      const midpoint = (threshold.max + threshold.min) / 2;
    

      const deviation = Math.abs(value - midpoint);
   

      const normalizedScore = Math.max(0, 100 - (deviation / range) * 100);
     

      score += normalizedScore * weight;
     

      totalWeight += weight;
      
    }

    if (totalWeight === 0) return null;
    

    const finalScore = score / totalWeight;
    

    return Math.round(Math.min(100, Math.max(0, finalScore)));
    
  }

  // STEP 3E — Record a vital reading 
  

 async recordVital({ userId, heartRate, spO2, bodyTemperature,
                    respiratoryRate, roomHumidity, ecgData, io }) {
 

  const readings = { heartRate, spO2, bodyTemperature, respiratoryRate, roomHumidity };

  const anomalies = this.checkThresholds(readings);
  const hasAnomaly = Object.keys(anomalies).length > 0;
  const healthScore = this.calculateHealthScore(readings);

  const vital = await vitalsRepository.create({
    userId, heartRate, spO2, bodyTemperature,
    respiratoryRate, roomHumidity, ecgData,
    hasAnomaly,
    anomalyDetails: hasAnomaly ? anomalies : null,
  });


  const payload = {
    vital,
    healthScore,
    hasAnomaly,
    anomalies: hasAnomaly ? anomalies : null,
    timestamp: new Date(),
  };

  emitVitalsUpdate(io, userId, payload);

  

  if (hasAnomaly) {
    emitAlert(io, userId, {
      message: "Anomaly detected in your vitals",
      anomalies,
      timestamp: new Date(),
    });
  
  }

  return payload;
}

  //  STEP 3F — Get latest vitals 


  async getLatestVitals(userId) {
    const vitals = await vitalsRepository.findLatestByUserId(userId);

    if (!vitals) return null;
   
    const healthScore = this.calculateHealthScore({
      heartRate: vitals.heartRate,
      spO2: vitals.spO2,
      bodyTemperature: vitals.bodyTemperature,
      respiratoryRate: vitals.respiratoryRate,
      roomHumidity: vitals.roomHumidity,
    });

    return {
      ...vitals.dataValues,
      
      healthScore,
    };
  }

  //STEP 3G — Get history 
  

  async getVitalsHistory(userId, days = 30) {
    const vitals = await vitalsRepository.findHistoryByUserId(userId, days);

    if (!vitals.length) return [];

    
    const averages = this.calculateAverages(vitals);

    return {
      readings: vitals,
     
      averages,
   
      totalReadings: vitals.length,
      anomalyCount: vitals.filter(v => v.hasAnomaly).length,
     
    };
  }

  //  STEP 3H — Calculate averages 


  calculateAverages(vitals) {
    const sums = {
      heartRate: 0, spO2: 0,
      bodyTemperature: 0, respiratoryRate: 0, roomHumidity: 0,
    };
    const counts = { ...sums };
  

    for (const vital of vitals) {
      for (const metric of Object.keys(sums)) {
        if (vital[metric] !== null && vital[metric] !== undefined) {
          sums[metric] += vital[metric];
          counts[metric]++;
        }
      }
    }

    const averages = {};
    for (const metric of Object.keys(sums)) {
      averages[metric] = counts[metric] > 0
        ? parseFloat((sums[metric] / counts[metric]).toFixed(1))
        : null;
     
     
    }

    return averages;
  }

  async getVitalsHistory(userId, days = 30) {
  const [dailyAverages, rawReadings] = await Promise.all([
    vitalsRepository.findDailyAverages(userId, days),
    vitalsRepository.findRawReadings(userId, 7),
  
  ]);

  if (!dailyAverages.length) {
    return {
      dailyAverages: [],
      rawReadings: [],
      summary: null,
    };
  }

  // compute overall summary from the daily averages
  const summary = {
    avgHeartRate: this.average(dailyAverages, "avgHeartRate"),
    avgSpO2: this.average(dailyAverages, "avgSpO2"),
    avgBodyTemperature: this.average(dailyAverages, "avgBodyTemperature"),
    avgRespiratoryRate: this.average(dailyAverages, "avgRespiratoryRate"),
    avgRoomHumidity: this.average(dailyAverages, "avgRoomHumidity"),
    totalReadings: dailyAverages.reduce((sum, d) => sum + d.totalReadings, 0),
    totalAnomalies: dailyAverages.reduce((sum, d) => sum + d.anomalyCount, 0),
    periodDays: days,
  };

  return { dailyAverages, rawReadings, summary };
}

//  averages one field across all daily rows
average(rows, field) {
  const valid = rows.filter(r => r[field] !== null);
  if (!valid.length) return null;
  const sum = valid.reduce((acc, r) => acc + parseFloat(r[field]), 0);
  return parseFloat((sum / valid.length).toFixed(1));
}

}

export default new VitalsService();
