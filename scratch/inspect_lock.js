const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const base = path.join(__dirname, '..');
const file = path.join(base, '.next', 'app-path-routes-manifest.json');
console.log('cwd', process.cwd());
console.log('current pid', process.pid);
console.log('file', file);
console.log('exists', fs.existsSync(file));
if (fs.existsSync(file)) {
  try {
    console.log('stat', fs.statSync(file));
  } catch (err) {
    console.error('stat error', err.code, err.message);
  }
  try {
    fs.accessSync(file, fs.constants.W_OK);
    console.log('access: writable');
  } catch (err) {
    console.error('access error', err.code, err.message);
  }
  try {
    const bak = file + '.bak';
    fs.renameSync(file, bak);
    console.log('renamed to', bak);
    fs.renameSync(bak, file);
    console.log('renamed back successfully');
  } catch (err) {
    console.error('rename error', err.code, err.message);
  }
}
try {
  const out = execSync('wmic process where "name=\'node.exe\'" get ProcessId,CommandLine /FORMAT:LIST', { encoding: 'utf8' });
  console.log('wmic node output:\n', out);
} catch (err) {
  console.error('wmic error', err.status || err.message, err.stderr ? err.stderr.toString() : '');
}
try {
  const out2 = execSync('wmic process where "name=\'npm.exe\'" get ProcessId,CommandLine /FORMAT:LIST', { encoding: 'utf8' });
  console.log('wmic npm output:\n', out2);
} catch (err) {
  console.error('wmic npm error', err.status || err.message, err.stderr ? err.stderr.toString() : '');
}
console.log('--- handle debug ---');
const spawnSync = require('child_process').spawnSync;
const ps2 = spawnSync('powershell.exe', ['-NoProfile', '-Command', 'Get-Process | Sort-Object -Descending HandleCount | Select-Object -First 20 Id,ProcessName,HandleCount | Format-Table -AutoSize'], { encoding: 'utf8' });
console.log('powershell code', ps2.status);
console.log('powershell stdout:\n', ps2.stdout);
console.log('powershell stderr:\n', ps2.stderr);
