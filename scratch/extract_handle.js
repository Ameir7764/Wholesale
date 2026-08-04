const { spawnSync } = require('child_process');
const script = '$zip = Join-Path $env:TEMP "Handle.zip"; $out = Join-Path $env:TEMP "handle"; if (-Not (Test-Path $out)) { New-Item -ItemType Directory -Path $out | Out-Null }; Expand-Archive -LiteralPath $zip -DestinationPath $out -Force; Get-ChildItem $out -Filter "handle.exe" | Select-Object FullName | Format-List';
const encoded = Buffer.from(script, 'utf16le').toString('base64');
const ps = spawnSync('powershell.exe', ['-NoProfile', '-EncodedCommand', encoded], { encoding: 'utf8' });
console.log('code', ps.status);
console.log('stdout', ps.stdout);
console.log('stderr', ps.stderr);
