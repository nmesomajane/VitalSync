export enum PacketType {
  VITALS = 0x01,
  ECG = 0x02,
  BATTERY = 0x03,
}

export interface VitalsPacket {
  heartRate: number;
  spO2: number;
  temperature: number;
  respiratoryRate: number;
  roomHumidity: number;
  batteryLevel: number;
  timestamp: number;
  hasECG: boolean;
}

export interface ECGPacket {
  sequenceNumber: number;
  samples: number[];
}

export interface VitalData {
  heartRate: number;
  spo2: number;
  bodyTemperature: number;
  respiratoryRate: number;
  roomHumidity: number;
  ecgData: number[];
}