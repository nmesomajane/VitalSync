export enum PacketType {
  VITALS = 0x01,
  ECG = 0x02,
  BATTERY = 0x03,
}

export interface VitalsPacket {
  heartRate: number;
  spo2: number;
  temperature: number;
}

export interface ECGPacket {
  sequence: number;
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