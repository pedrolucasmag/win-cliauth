import { strict as assert } from 'assert';
import { test } from 'node:test';
import { countdown } from '../src/auth';
import { decryptBackup, encryptBackup } from '../src/backup';
import { findName } from '../src/names';
import { codePeriod } from '../src/otp';
import { currentVersion, isNewer } from '../src/update';

const BASE32 = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

test('backup round trip keeps every entry, including built-in names', () => {
  const vault = Object.assign(Object.create(null), {
    github: BASE32,
    steam: { secret: 'MTIzNDU2Nzg5MDEyMzQ1Njc4OTA=', steam: true },
    toString: BASE32,
  });
  const file = encryptBackup(vault, 'correct horse');
  assert.ok(!file.includes(BASE32), 'secrets must not appear in the backup');
  assert.deepEqual({ ...decryptBackup(file, 'correct horse') }, { ...vault });
});

test('backup rejects a wrong password, tampering and foreign files', () => {
  const file = encryptBackup(Object.assign(Object.create(null), { github: BASE32 }), 'correct horse');
  assert.throws(() => decryptBackup(file, 'wrong horse'), /Wrong password/);
  const tampered = JSON.parse(file);
  tampered.data = Buffer.from('{"github":"AAAA"}').toString('base64');
  assert.throws(() => decryptBackup(JSON.stringify(tampered), 'correct horse'), /Wrong password/);
  assert.throws(() => decryptBackup('{"hello":1}', 'correct horse'), /Not a win-cliauth backup/);
  assert.throws(() => decryptBackup('not json', 'correct horse'), /Not a win-cliauth backup/);
});

test('names match exactly, case-insensitively, or by unique prefix', () => {
  const names = ['microsoft', 'GitHub', 'github-work', 'Steam', 'steam'];
  assert.deepEqual(findName(names, 'microsoft'), { name: 'microsoft' });
  assert.deepEqual(findName(names, 'micro'), { name: 'microsoft' });
  assert.deepEqual(findName(names, 'MICRO'), { name: 'microsoft' });
  assert.deepEqual(findName(names, 'github'), { name: 'GitHub' });
  assert.deepEqual(findName(names, 'steam'), { name: 'steam' });
  assert.match((findName(names, 'STEAM') as { error: string }).error, /several/);
  assert.match((findName(names, 'git') as { error: string }).error, /GitHub, github-work/);
  assert.match((findName(names, 'nope') as { error: string }).error, /not found/);
  assert.deepEqual(findName(names, 'toString'), { error: 'toString not found.' });
});

test('code period comes from otpauth:// URIs, otherwise 30 seconds', () => {
  assert.equal(codePeriod(BASE32, false), 30);
  assert.equal(codePeriod(`otpauth://totp/x?secret=${BASE32}&period=60`, false), 60);
  assert.equal(codePeriod(`otpauth://totp/x?secret=${BASE32}&period=60`, true), 30);
});

test('version comparison', () => {
  assert.ok(isNewer('1.0.10', '1.0.9'));
  assert.ok(isNewer('1.1.0', '1.0.99'));
  assert.ok(isNewer('2.0.0', '1.9.9'));
  assert.ok(!isNewer('1.0.5', '1.0.5'));
  assert.ok(!isNewer('1.0.4', '1.0.5'));
  assert.match(currentVersion(), /^\d+\.\d+\.\d+/);
});

test('countdown bar shrinks with the time left', () => {
  assert.equal(countdown('123456', 30_000, 30), `123456  ${'█'.repeat(20)} 30s`);
  assert.equal(countdown('123456', 15_000, 30), `123456  ${'█'.repeat(10)}${'░'.repeat(10)} 15s`);
  assert.equal(countdown('BC2DF', 1_500, 30), `BC2DF  ${'█'.repeat(1)}${'░'.repeat(19)}  2s`);
});
