// hash a lat and a lng into a decimal number that represents its location using geohashing
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

// decode a decimal geohash back into a lat and lng
const decode = (geoDecimal, resolution) => {
  let binaryString = Number(geoDecimal).toString(2);
  while (binaryString.length < resolution) {
    binaryString = `0${binaryString}`;
  }
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

const addMetersToLatLng = (lng, dx, lat, dy) => {
  const radiusOfEarth = 6371000;
  const newLat = lat + (dy / radiusOfEarth) * (180 / Math.PI);
  const newLng = lng + (dx / radiusOfEarth) * (180 / Math.PI / Math.cos(lat * Math.PI / 180));
  return [newLat, newLng];
};

// get geohahing bit length / resolution for given radius in meters
const getResolution = (size) => {
  if (size === 'small') {
    return 35; // 50m x 50m box
  } else if (size === 'medium') {
    return 30; // 300m x 300m box
  } else if (size === 'large') {
    return 25; // 2km x 2km box
  }
  return 50;
};

module.exports = {
  hash,
  decode,
  addMetersToLatLng,
  getResolution,
};
