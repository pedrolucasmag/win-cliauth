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

test('TOTP matches RFC 6238 vectors for SHA-256 and SHA-512', () => {
  const sha256 = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZA====';
  const sha512 = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNA=';
  const uri = (secret: string, algorithm: string) => `otpauth://totp/x?secret=${secret}&algorithm=${algorithm}&digits=8`;
  for (const [time, sha1Code, sha256Code, sha512Code] of [
    [59, '94287082', '46119246', '90693936'],
    [1111111109, '07081804', '68084774', '25091201'],
    [20000000000, '65353130', '77737706', '47863826'],
  ] as const) {
    assert.equal(totpCode(uri(BASE32, 'SHA1'), time * 1000), sha1Code);
    assert.equal(totpCode(uri(sha256, 'SHA256'), time * 1000), sha256Code);
    assert.equal(totpCode(uri(sha512, 'SHA512'), time * 1000), sha512Code);
  }
});

test('TOTP accepts padded and dashed base32 and honours the period', () => {
  assert.equal(totpCode(`${BASE32}====`, 59_000), '287082');
  assert.equal(totpCode('GEZD-GNBV-GY3T-QOJQ-GEZD-GNBV-GY3T-QOJQ', 59_000), '287082');
  assert.equal(totpCode(`otpauth://totp/x?secret=${BASE32}&period=60`, 119_000), totpCode(BASE32, 59_000));
});

test('TOTP rejects invalid secrets and URIs', () => {
  assert.throws(() => totpCode('not a secret!', 0), /not a base32 character/);
  assert.throws(() => totpCode('', 0), /empty/);
  assert.throws(() => totpCode(`otpauth://hotp/x?secret=${BASE32}&counter=1`, 0), /Only TOTP/);
  assert.throws(() => totpCode('otpauth://totp/x?digits=6', 0), /no secret/);
  assert.throws(() => totpCode(`otpauth://totp/x?secret=${BASE32}&algorithm=MD5`, 0), /Unsupported algorithm/);
  assert.throws(() => totpCode(`otpauth://totp/x?secret=${BASE32}&digits=0`, 0), /Invalid digits/);
  assert.throws(() => totpCode(`otpauth://totp/x?secret=${BASE32}&period=-5`, 0), /Invalid period/);
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
