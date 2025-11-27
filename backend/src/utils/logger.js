const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '..', '..', 'logs', 'app.log');
try { fs.mkdirSync(path.dirname(logFile), { recursive: true }); } catch(e){}

function write(level, msg) {
  const line = `${new Date().toISOString()} [${level}] ${typeof msg === 'string' ? msg : JSON.stringify(msg)}\n`;
  fs.appendFileSync(logFile, line);
}

module.exports = {
  info: (m) => write('INFO', m),
  warn: (m) => write('WARN', m),
  error: (m) => write('ERROR', m)
};
