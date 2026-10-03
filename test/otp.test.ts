import { strict as assert } from 'assert';
import { test } from 'node:test';
import { steamCode, steamSecret, totpCode } from '../src/otp';

// RFC 6238 SHA1 seed "12345678901234567890"
const ASCII = Buffer.from('12345678901234567890');
const BASE32 = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
const BASE64 = ASCII.toString('base64');

test('TOTP matches RFC 6238 vectors', () => {
  assert.equal(totpCode(BASE32, 59_000), '287082');
  assert.equal(totpCode(BASE32, 1111111109_000), '081804');
  assert.equal(totpCode('gezd gnbv gy3t qojq gezd gnbv gy3t qojq', 1234567890_000), '005924');
});

test('TOTP honours otpauth:// URI parameters', () => {
  assert.equal(totpCode(`otpauth://totp/x?secret=${BASE32}&digits=8`, 59_000), '94287082');
});

test('TOTP rejects invalid secrets', () => {
  assert.throws(() => totpCode('not a secret!', 0));
});

test('Steam codes match steam-totp reference values', () => {
  assert.equal(steamCode(BASE64, 59_000), 'PV9M4');
  assert.equal(steamCode(BASE64, 1111111109_000), 'PY4YB');
  assert.equal(steamCode(BASE64, 1700000000_000), 'R87JJ');
});

test('Steam secret accepts base64, hex, base32, steam:// and otpauth://', () => {
  for (const secret of [
    BASE64,
    ASCII.toString('hex'),
    BASE32,
    `steam://${BASE32}`,
    `otpauth://totp/Steam:me?secret=${BASE32}&issuer=Steam`,
  ]) {
    assert.deepEqual(steamSecret(secret), ASCII, secret);
  }
  assert.throws(() => steamSecret('***'));
});
