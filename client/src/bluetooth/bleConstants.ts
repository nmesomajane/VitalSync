

export const BLE_DEVICE_NAME = "VitalSync-ESP32";


//  Service UUID 
export const BLE_SERVICE_UUID = "9e400001-7a54-4d5b-8f1c-4a5f00000001";


//  Characteristic UUIDs 
export const BLE_CHARACTERISTICS = {
  DATA: "9e400002-7a54-4d5b-8f1c-4a5f00000001",
 


  CONTROL: "9e400003-7a54-4d5b-8f1c-4a5f00000001",
 
};

//Packet type identifiers 

export const PACKET_TYPES = {
  VITALS: 0x01,
  ECG: 0x02,
  CLASSIFICATION: 0x03,

} as const;

//Measurement constants 
export const ECG_TOTAL_SAMPLES = 1000;

export const ECG_TOTAL_FRAGMENTS = 143;
export const SAMPLES_PER_FRAGMENT = 7;


//  Classification values 
export const OVERALL_CLASSIFICATION = {
  NORMAL: 0,
  ABNORMAL: 1,
  CRITICAL: 2,
  SENSOR_ERROR: 3,
} as const;

export const ECG_CLASSIFICATION = {
  NORMAL: 0,

  ABNORMAL: 1,

  UNAVAILABLE: 2,

} as const;

export const ECG_FLAGS = {
  ECG_CONTACT: 0x01,
  RHYTHM_AVAILABLE: 0x02,
  IRREGULAR_RHYTHM: 0x04,
} as const;


export const UNAVAILABLE_SENSOR = 0xFF;
