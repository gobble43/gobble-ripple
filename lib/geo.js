
const hash = (lat, lng, bits) => {
  bits = bits || 50;

  let binaryGeoHash = '';
  let toggle = false;

  let minLat = -90;
  let maxLat = 90;

  let minLng = -180;
  let maxLng = 180;

  for (let i = 0; i < bits; i++) {
    if (toggle) {
      const midLat = (minLat + maxLat) / 2;
      if (lat < midLat) {
        binaryGeoHash += '0';
        maxLat = midLat;
      } else {
        binaryGeoHash += '1';
        minLat = midLat;
      }
    } else {
      const midLng = (minLng + maxLng) / 2;
      if (lng < midLng) {
        binaryGeoHash += '0';
        maxLng = midLng;
      } else {
        binaryGeoHash += '1';
        minLng = midLng;
      }
    }
    toggle = !toggle;
  }
  return parseInt(binaryGeoHash, 2);
};

const decode = (geoDecimal) => {
  const binaryString = geoDecimal.toString(2);

  let toggle = false;

  let minLat = -90;
  let maxLat = 90;

  let minLng = -180;
  let maxLng = 180;

  for (let i = 0; i < binaryString.length; i++) {
    const char = binaryString[i];
    if (toggle) {
      const midLat = (minLat + maxLat) / 2;
      if (char === '0') {
        maxLat = midLat;
      } else {
        minLat = midLat;
      }
    } else {
      const midLng = (minLng + maxLng) / 2;
      if (char === '0') {
        maxLng = midLng;
      } else {
        minLng = midLng;
      }
    }
    toggle = !toggle;
  }
  return [(minLat + maxLat) / 2, (minLng + minLng) / 2];
};

module.exports = {
  hash,
  decode,
};
