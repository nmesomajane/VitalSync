
import {
  PACKET_TYPES,
  ECG_FLAGS,
  OVERALL_CLASSIFICATION,
  ECG_CLASSIFICATION,
  UNAVAILABLE_SENSOR,
} from "./bleConstants";

// TypeScript interfaces matching each packet type 

export interface VitalsPacket {
  type: "vitals";
  heartRate: number | null;
  spO2: number | null;
  bodyTemperature: number;
  respiratoryRate: number | null;
  roomHumidity: number | null;
  batteryLevel: number | null;
  timestamp: number;
  measurementSequence?: number;
}

export interface ClassificationPacket {
  type: "classification";
  measurementSequence: number;
  overallClassification: number;
  overallClassificationLabel: string;

  ecgFlags: {
    ecgContact: boolean;
    rhythmAvailable: boolean;
    irregularRhythm: boolean;
  };
  ecgClassification: number;
  ecgClassificationLabel: string;
  ecgBPM: number;
  confidence: number;

}

export interface ECGFragment {
  type: "ecg_fragment";
  measurementSequence: number;
  fragmentIndex: number;

  totalFragments: number;
  sampleCount: number;
 
  samples: number[];
}

export type DecodedPacket = VitalsPacket | ClassificationPacket | ECGFragment;


const readUInt16LE = (data: number[], offset: number): number => {
  return data[offset] | (data[offset + 1] << 8);
};

//  Little-endian uint32 reader 
const readUInt32LE = (data: number[], offset: number): number => {
  return (
    data[offset] |
    (data[offset + 1] << 8) |
    (data[offset + 2] << 16) |
    (data[offset + 3] << 24)
  );
};


const readInt16LE = (data: number[], offset: number): number => {
  let raw = data[offset] | (data[offset + 1] << 8);
 
  if (raw >= 32768) {
    raw = raw - 65536;

  }
  return raw;
};


export const decodePacket = (data: number[]): DecodedPacket => {
  if (!data || data.length === 0) {
    throw new Error("Empty packet received");
  }

  const packetType = data[0];


  switch (packetType) {
    case PACKET_TYPES.VITALS:
      return decodeVitalsPacket(data);
    case PACKET_TYPES.CLASSIFICATION:
      return decodeClassificationPacket(data);
    case PACKET_TYPES.ECG:
      return decodeECGFragment(data);
    default:
      throw new Error(
        `Unknown packet type: 0x${packetType.toString(16).toUpperCase()}`
      );
  }
};


const decodeVitalsPacket = (data: number[]): VitalsPacket => {
  if (data.length < 12) {
    throw new Error(`Vitals packet too short: ${data.length} bytes (need 12)`);
  }

  const heartRateRaw = data[1];
  const spO2Raw = data[2];


  const temperatureRaw = readUInt16LE(data, 3);
  const bodyTemperature = temperatureRaw / 10.0;


  return {
    type: "vitals",
    heartRate: heartRateRaw === 0 ? null : heartRateRaw,
   
    spO2: spO2Raw === 0 ? null : spO2Raw,
    bodyTemperature,
    respiratoryRate:
      data[5] === UNAVAILABLE_SENSOR ? null : data[5],
    roomHumidity:
      data[6] === UNAVAILABLE_SENSOR ? null : data[6],
    batteryLevel:
      data[7] === UNAVAILABLE_SENSOR ? null : data[7],
    timestamp: readUInt32LE(data, 8),
  };
};


const decodeClassificationPacket = (data: number[]): ClassificationPacket => {
  if (data.length < 8) {
    throw new Error(
      `Classification packet too short: ${data.length} bytes (need 8)`
    );
  }

  const flags = data[4];
 

  const overallClass = data[3];
  const overallLabels = ["Normal", "Abnormal", "Critical", "Sensor Error"];

  const ecgClass = data[5];
  const ecgLabels = ["Normal", "Abnormal", "Unavailable"];

  return {
    type: "classification",
    measurementSequence: readUInt16LE(data, 1),
    overallClassification: overallClass,
    overallClassificationLabel: overallLabels[overallClass] ?? "Unknown",
    ecgFlags: {
      ecgContact: (flags & ECG_FLAGS.ECG_CONTACT) !== 0,
   
      rhythmAvailable: (flags & ECG_FLAGS.RHYTHM_AVAILABLE) !== 0,
     
      irregularRhythm: (flags & ECG_FLAGS.IRREGULAR_RHYTHM) !== 0,
     
    },
    ecgClassification: ecgClass,
    ecgClassificationLabel: ecgLabels[ecgClass] ?? "Unknown",
    ecgBPM: data[6],
    confidence: data[7],
  };
};


const decodeECGFragment = (data: number[]): ECGFragment => {
  if (data.length < 6) {
    throw new Error(
      `ECG fragment too short: ${data.length} bytes (need at least 6)`
    );
  }

  const sampleCount = data[5];
  const samples: number[] = [];

  
  for (let i = 0; i < sampleCount; i++) {
    const offset = 6 + i * 2;
    

    if (offset + 1 >= data.length) {
      console.warn(
        `ECG fragment: expected ${sampleCount} samples but ran out of data at sample ${i}`
      );
      break;
    }

    const rawSample = readInt16LE(data, offset);
    const normalised = rawSample / 32767.0;


    samples.push(normalised);
  }

  return {
    type: "ecg_fragment",
    measurementSequence: readUInt16LE(data, 1),
    fragmentIndex: data[3],
    totalFragments: data[4],
    sampleCount,
    samples,
  };
};

// Convert vitals to API request body
// bridges BLE decoded data to your REST API format
export const vitalsToAPIBody = (
  vitals: VitalsPacket,
  classification: ClassificationPacket | null,
  ecgSamples: number[]
) => {
  return {
    heartRate: vitals.heartRate,
    spO2: vitals.spO2,
    bodyTemperature: vitals.bodyTemperature,
    respiratoryRate: vitals.respiratoryRate,
    roomHumidity: vitals.roomHumidity,
    ecgData: ecgSamples.length > 0 ? ecgSamples : undefined,

    tinyMLClassification: classification
      ? mapECGClassification(classification)
      : undefined,
    tinyMLConfidence: classification
      ? classification.confidence / 100
      : undefined,
   
  };
};


const mapECGClassification = (c: ClassificationPacket): string => {
  if (c.overallClassification === OVERALL_CLASSIFICATION.CRITICAL) {
    return "atrial_fibrillation";
    // critical overall = most likely AFib based on your TinyML training
  }
  if (c.ecgFlags.irregularRhythm) {
    return "ventricular_premature_contraction";
  }
  if (c.ecgClassification === ECG_CLASSIFICATION.NORMAL) {
    return "normal_sinus";
  }
  return "normal_sinus";
};