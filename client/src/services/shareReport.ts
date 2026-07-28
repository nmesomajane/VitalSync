import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export const generateAndShareHealthReport = async (
  vitals: any,
  summary: any,
  userName: string
): Promise<void> => {
  const reportDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          color: #1a1a2e;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: 800;
          color: #2563eb;
        }
        .logo span { color: #ef4444; }
        .date { color: #64748b; font-size: 13px; }
        .patient-name {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #2563eb;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 24px 0 12px;
          padding-bottom: 6px;
          border-bottom: 1px solid #e2e8f0;
        }
        .vitals-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }
        .vital-card {
          background: #f8fafc;
          border-radius: 10px;
          padding: 14px;
          border: 1px solid #e2e8f0;
          text-align: center;
        }
        .vital-label {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .vital-value {
          font-size: 22px;
          font-weight: 800;
          color: #1a1a2e;
        }
        .vital-unit {
          font-size: 11px;
          color: #94a3b8;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 13px;
        }
        .summary-label { color: #64748b; }
        .summary-value { font-weight: 600; color: #1a1a2e; }
        .footer {
          margin-top: 40px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
          font-size: 11px;
          color: #94a3b8;
          text-align: center;
        }
        .disclaimer {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 12px;
          font-size: 11px;
          color: #92400e;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">Vital<span>Sync</span></div>
          <div style="font-size:12px; color:#64748b; margin-top:4px;">
            Real-Time Health Monitoring Report
          </div>
        </div>
        <div style="text-align:right">
          <div class="date">Generated: ${reportDate}</div>
          <div class="date">Report Type: Health Summary</div>
        </div>
      </div>

      <div class="patient-name">${userName}</div>
      <div style="color:#64748b; font-size:13px;">Patient Health Summary</div>

      <div class="section-title">Current Vitals</div>
      <div class="vitals-grid">
        <div class="vital-card">
          <div class="vital-label">❤️ Heart Rate</div>
          <div class="vital-value">
            ${vitals?.heartRate ?? "--"}
            <span class="vital-unit">bpm</span>
          </div>
        </div>
        <div class="vital-card">
          <div class="vital-label">🫁 Blood Oxygen</div>
          <div class="vital-value">
            ${vitals?.spO2 ?? "--"}
            <span class="vital-unit">%</span>
          </div>
        </div>
        <div class="vital-card">
          <div class="vital-label">🌡️ Temperature</div>
          <div class="vital-value">
            ${vitals?.bodyTemperature ?? "--"}
            <span class="vital-unit">°C</span>
          </div>
        </div>
        <div class="vital-card">
          <div class="vital-label">💨 Respiratory</div>
          <div class="vital-value">
            ${vitals?.respiratoryRate ?? "--"}
            <span class="vital-unit">/min</span>
          </div>
        </div>
        <div class="vital-card">
          <div class="vital-label">💧 Humidity</div>
          <div class="vital-value">
            ${vitals?.roomHumidity ?? "--"}
            <span class="vital-unit">%</span>
          </div>
        </div>
        <div class="vital-card">
          <div class="vital-label">📊 Health Score</div>
          <div class="vital-value">
            ${vitals?.healthScore ?? "--"}
            <span class="vital-unit">/100</span>
          </div>
        </div>
      </div>

      ${summary ? `
      <div class="section-title">30-Day Summary</div>
      <div class="summary-row">
        <span class="summary-label">Average Heart Rate</span>
        <span class="summary-value">${summary.avgHeartRate?.toFixed(1) ?? "--"} bpm</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Average SpO₂</span>
        <span class="summary-value">${summary.avgSpO2?.toFixed(1) ?? "--"} %</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Average Temperature</span>
        <span class="summary-value">${summary.avgBodyTemperature?.toFixed(1) ?? "--"} °C</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Total Readings</span>
        <span class="summary-value">${summary.totalReadings?.toLocaleString() ?? "--"}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Anomalies Detected</span>
        <span class="summary-value">${summary.totalAnomalies ?? 0} events</span>
      </div>
      ` : ""}

      <div class="disclaimer">
        ⚠️ This report is generated from IoT sensor data for monitoring purposes only.
        It is not a clinical diagnosis. Please consult a qualified healthcare professional
        for medical advice.
      </div>

      <div class="footer">
        VitalSync Health Monitoring System · Final Year Project 2025<br>
        Electronic Engineering · FUTO<br>
        Report generated on ${reportDate}
      </div>
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({
    html,
   
    base64: false,
  });

  console.log("PDF generated at:", uri);

  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    dialogTitle: "Share Health Report",
    UTI: "com.adobe.pdf",
   
  });
 
};