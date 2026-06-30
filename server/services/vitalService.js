import vitalsRepository from "../repository/vitalRepository.js";
import AppError from "../utilis/appError.js";
import { emitVitalsUpdate, emitAlert } from "../socket/socketManager.js";
import alertService from "./alertService.js";

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
  heartRate: 0.3,
  spO2: 0.3,
  bodyTemperature: 0.2,
  respiratoryRate: 0.15,
  roomHumidity: 0.05,
};

class VitalsService {
  //   Check thresholds

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

  // Calculate health score

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

  // Record a vital reading

  async recordVital({
    userId,
    heartRate,
    spO2,
    bodyTemperature,
    respiratoryRate,
    roomHumidity,
    ecgData,
    io,
  }) {
    const readings = {
      heartRate,
      spO2,
      bodyTemperature,
      respiratoryRate,
      roomHumidity,
    };

    const anomalies = this.checkThresholds(readings);
    const hasAnomaly = Object.keys(anomalies).length > 0;
    const healthScore = this.calculateHealthScore(readings);

    const vital = await vitalsRepository.create({
      userId,
      heartRate,
      spO2,
      bodyTemperature,
      respiratoryRate,
      roomHumidity,
      ecgData,
      hasAnomaly,
      anomalydetails: hasAnomaly ? anomalies : null,
    });
    const alerts = await alertService.checkAndCreateAlerts({
      userId,
      readings: {
        heartRate,
        spO2,
        bodyTemperature,
        respiratoryRate,
        roomHumidity,
      },
      io,
      
    });

    return {
      vital,
      healthScore,
      hasAnomaly: alerts.length > 0,
      alerts,
     
    };

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

  //   Get latest vitals

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



 

  //  STEP 3H — Calculate averages

  calculateAverages(vitals) {
    const sums = {
      heartRate: 0,
      spO2: 0,
      bodyTemperature: 0,
      respiratoryRate: 0,
      roomHumidity: 0,
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
      averages[metric] =
        counts[metric] > 0
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
    const valid = rows.filter((r) => r[field] !== null);
    if (!valid.length) return null;
    const sum = valid.reduce((acc, r) => acc + parseFloat(r[field]), 0);
    return parseFloat((sum / valid.length).toFixed(1));
  }



 

  //  ADD THIS METHOD 
  async getLatestECG(userId) {
    const reading = await vitalsRepository.findLatestECG(userId);

    if (!reading || !reading.ecgData) return null;

    const analysis = this.analyseECG(reading.ecgData);
    // calling this.analyseECG — must exist as a method below

    const formattedWaveform = reading.ecgData.map((value, index) => ({
      x: index,
      y: value,
    }));

    return {
      waveform: formattedWaveform,
      rawData: reading.ecgData,
      analysis: {
        rhythmStatus: analysis.status,
        derivedHeartRate: analysis.derivedHeartRate,
        hrv: analysis.hrv,
        peakCount: analysis.peakCount,
        rrIntervals: analysis.rrIntervals,
        message: analysis.message,
      },
      recordedAt: reading.createdAt,
      hasAnomaly: reading.hasAnomaly,
      anomalyDetails: reading.anomalyDetails,
      // fixed casing — was "anomalydetails" lowercase d
      // must match exactly what the frontend ECGData interface expects
    };
  }

  //  ADD THIS METHOD - analyses the ECG waveform 
  analyseECG(ecgData) {
   

    if (!ecgData || !Array.isArray(ecgData) || ecgData.length === 0) {
      return {
        status: "insufficient_data",
        message: "Not enough ECG data",
        derivedHeartRate: null,
        hrv: null,
        peakCount: 0,
        rrIntervals: [],
      };
    }

    // find all peaks (heartbeats) in the waveform
    const peaks = this.findPeaks(ecgData);
   

    if (peaks.length < 2) {
      return {
        status: "insufficient_peaks",
        message: "Could not detect enough heartbeats",
        derivedHeartRate: null,
        hrv: null,
        peakCount: peaks.length,
        rrIntervals: [],
      };
    }

    // calculate RR intervals — time between consecutive peaks
    const samplingInterval = 4;
   

    const rrIntervals = [];
    for (let i = 1; i < peaks.length; i++) {
      const rr = (peaks[i] - peaks[i - 1]) * samplingInterval;
      rrIntervals.push(rr);
    }

    // derive heart rate from average RR interval
    const avgRR = rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length;
    const derivedHeartRate = Math.round(60000 / avgRR);
   

    const rrVariance = rrIntervals.reduce((sum, rr) => {
      return sum + Math.pow(rr - avgRR, 2);
    }, 0) / rrIntervals.length;
    const hrv = Math.round(Math.sqrt(rrVariance));
 

    // classify rhythm based on HRV
    let status;
    let message;

    if (hrv < 20) {
      status = "regular";
      message = "Normal sinus rhythm detected";
    } else if (hrv < 50) {
      status = "slightly_irregular";
      message = "Minor rhythm variation — continue monitoring";
    } else {
      status = "irregular";
      message = "Irregular rhythm detected — consult a doctor";
    }

    return {
      status,
      derivedHeartRate,
      hrv,
      peakCount: peaks.length,
      rrIntervals,
      message,
    };
  }

  //  ADD THIS METHOD - finds peaks in the waveform 
  findPeaks(ecgData) {
    const peaks = [];
    const maxValue = Math.max(...ecgData);
    const threshold = maxValue * 0.5;
   

    for (let i = 1; i < ecgData.length - 1; i++) {
      if (
        ecgData[i] > ecgData[i - 1] &&
      
        ecgData[i] > ecgData[i + 1] &&
      
        ecgData[i] > threshold
      
      ) {
        peaks.push(i);
        
      }
    }

    return peaks;
  }

 


}

export default new VitalsService();
