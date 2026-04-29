const fs = require("fs");

const readData = (path) => {
  const data = fs.readFileSync(path);
  return JSON.parse(data);
};

const writeData = (path, data) => {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
};

module.exports = { readData, writeData };