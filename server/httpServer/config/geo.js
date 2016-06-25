
const geoHash = (lat, lng, bits) => {
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
  }
  toggle = !toggle;
  console.log(binaryGeoHash);
  return parseInt(binaryGeoHash, 2);
};
// console.log(geoHash(50, 50));
// console.log(geoHash(50, 50.00000001));

module.exports = {
  geoHash,
};
