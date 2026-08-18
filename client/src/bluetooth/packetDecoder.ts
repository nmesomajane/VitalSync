export const decodeVitalsPacket = (data: Uint8Array) => {
  const packetType = data[0];

  if (packetType !== 0x01) {
    throw new Error("Invalid vitals packet");
  }

  const heartRate = data[1];
  const spo2 = data[2];

  const temperatureRaw =
    (data[3] << 8) | data[4];

  const temperature = temperatureRaw / 10;

  return {
    heartRate,
    spo2,
    temperature,
    respiratoryRate: data[5],
    roomHumidity: data[6],
  };
};