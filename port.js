// https://github.com/baalexander/node-portscanner
const { findAPortNotInUse } = require('portscanner');
const LOCALHOST_IP = '127.0.0.1';

const range = (from, to) =>
  Array.from({ length: to - from }, (_element, index) => index + from);

const findFreePort = async portsArray => {
  const freePort = await new Promise(resolve => {
    findAPortNotInUse(portsArray, LOCALHOST_IP, (_error, port) => {
      resolve(port);
    });
  });
  if (!freePort) {
    throw new Error(`No free port within ${portsArray}`);
  }
  return freePort;
};

(async () => {
  const ports = range(1112, 1115);
  console.log(`ports range: ${ports}`);

  const freePort = await findFreePort(ports);
  console.log(freePort);
})();
