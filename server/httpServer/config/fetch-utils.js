const checkStatus = (res) => {
  if (!res.ok) {
    throw Error();
  }
  return res.json();
};

module.exports = {
  checkStatus,
};
