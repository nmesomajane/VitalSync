// src/bluetooth/packetDecoder.ts

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
  // identifies position in the ECG sequence
  samples: number[];
  // raw ADC values from the ECG sensor
}


export const decodeVitalsPacket = (data: number[]): VitalsPacket => {
  if (!data || data.length < 8) {
    throw new Error(`Vitals packet too short: ${data?.length} bytes`);
  }

  const packetType = data[0];
  if (packetType !== 0x01) {
    throw new Error(`Expected vitals packet (0x01), got: 0x${packetType.toString(16)}`);
  }



  const temperatureRaw = (data[3] << 8) | data[4];

  const temperature = temperatureRaw / 10;

  const timestamp =
    (data[8] << 24) | (data[9] << 16) | (data[10] << 8) | data[11];

  return {
    heartRate: data[1],
    spO2: data[2],
    temperature,
    respiratoryRate: data[5],
    roomHumidity: data[6],
    batteryLevel: data[7],
    timestamp,
    hasECG: data[12] === 1,
   
  };
};



export const decodeECGPacket = (data: number[]): ECGPacket => {
  if (data[0] !== 0x02) {
    throw new Error("Not an ECG packet");
  }

  const sequenceNumber = data[1];
  const samples = data.slice(2);

  const normalisedSamples = samples.map(s => (s - 128) / 128);

  return { sequenceNumber, samples: normalisedSamples };
};


export const blePacketToAPIBody = (vitals: VitalsPacket, ecgSamples: number[] = []) => {
  return {
    heartRate: vitals.heartRate,
    spO2: vitals.spO2,
    bodyTemperature: vitals.temperature,
    respiratoryRate: vitals.respiratoryRate,
    roomHumidity: vitals.roomHumidity,
    ecgData: ecgSamples.length > 0 ? ecgSamples : undefined,
   
  };
};