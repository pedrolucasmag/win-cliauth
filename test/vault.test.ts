import { strict as assert } from 'assert';
import { spawnSync } from 'child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { after, test } from 'node:test';
import { tmpdir } from 'os';
import { join } from 'path';
import { steamCode, totpCode } from '../src/otp';

// End-to-end tests through PowerShell/DPAPI; they need Windows (run in CI on windows-latest).
const skip = process.platform !== 'win32' && 'needs Windows (PowerShell + DPAPI)';

const appData = mkdtempSync(join(tmpdir(), 'win-cliauth-'));
const keyPath = join(appData, 'win-cliauth', 'keys');
const main = join(__dirname, '..', 'main.js');
after(() => rmSync(appData, { recursive: true, force: true }));

const BASE32 = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
const STEAM = Buffer.from('12345678901234567890').toString('base64');

function cli(args: string[], input?: string) {
  const result = spawnSync(process.execPath, [main, ...args], {
    input,
    encoding: 'utf8',
    env: { ...process.env, APPDATA: appData },
  });
  return { code: result.status, stdout: result.stdout.trim(), stderr: result.stderr.trim() };
}

// Accepts the code of the previous, current or next 30s window to avoid boundary flakiness.
function assertCode(actual: string, generate: (timestamp: number) => string) {
  const now = Date.now();
  const valid = [now - 30_000, now, now + 30_000].map(generate);
  assert.ok(valid.includes(actual), `${actual} is not one of ${valid.join(', ')}`);
}

test('vault round trip through PowerShell', { skip }, async (t) => {
  await t.test('empty vault lists nothing', () => {
    assert.equal(cli(['list']).code, 0);
    assert.equal(existsSync(keyPath), false);
  });

  await t.test('adds a TOTP secret from stdin, including quotes in the name', () => {
    const result = cli(['add', "bob's account"], BASE32);
    assert.equal(result.code, 0, result.stderr);
    assert.ok(existsSync(keyPath));
  });

  await t.test('gets the TOTP code', () => {
    const result = cli(['get', "bob's account"]);
    assert.equal(result.code, 0, result.stderr);
    assertCode(result.stdout, (ts) => totpCode(BASE32, ts));
  });

  await t.test('refuses to overwrite without --replace', () => {
    assert.equal(cli(['add', "bob's account"], BASE32).code, 1);
    assert.equal(cli(['add', "bob's account", '--replace'], BASE32).code, 0);
    assert.ok(existsSync(`${keyPath}.bak`));
  });

  await t.test('rejects invalid secrets without storing them', () => {
    assert.equal(cli(['add', 'bad'], 'not!valid').code, 1);
    assert.equal(cli(['get', 'bad']).code, 1);
  });

  await t.test('stores and remembers Steam accounts', () => {
    const maFile = join(appData, 'account.maFile');
    writeFileSync(maFile, JSON.stringify({ shared_secret: STEAM, account_name: 'me' }));
    assert.equal(cli(['add', 'steam', '--mafile', maFile]).code, 0);
    const result = cli(['get', 'steam']);
    assert.equal(result.code, 0, result.stderr);
    assertCode(result.stdout, (ts) => steamCode(STEAM, ts));
  });

  await t.test('treats built-in property names as ordinary names', () => {
    assert.equal(cli(['get', 'toString']).code, 1);
    assert.equal(cli(['add', 'constructor'], BASE32).code, 0);
    assertCode(cli(['get', 'constructor']).stdout, (ts) => totpCode(BASE32, ts));
  });

  await t.test('lists names, and secrets only with --showsecret', () => {
    const list = cli(['list']);
    assert.ok(list.stdout.includes("bob's account") && list.stdout.includes('steam'));
    assert.ok(!list.stdout.includes(BASE32));
    assert.ok(cli(['list', '--showsecret']).stdout.includes(BASE32));
  });

  await t.test('gets by unique prefix and renames', () => {
    assertCode(cli(['get', 'BOB']).stdout, (ts) => totpCode(BASE32, ts));
    assert.equal(cli(['rename', "bob's account", 'bob']).code, 0);
    assert.equal(cli(['rename', 'bob', 'steam']).code, 1, 'must not overwrite an existing name');
    assert.equal(cli(['rename', 'missing', 'x']).code, 1);
    assertCode(cli(['get', 'bob']).stdout, (ts) => totpCode(BASE32, ts));
    assert.equal(cli(['rename', 'bob', "bob's account"]).code, 0);
  });

  await t.test('exports and imports a password-protected backup', () => {
    const backup = join(appData, 'backup.json');
    assert.equal(cli(['export', backup], 'short').code, 1, 'rejects short passwords');
    assert.equal(cli(['export', backup], 'correct horse').code, 0);
    assert.equal(cli(['export', backup], 'correct horse').code, 1, 'does not overwrite without --force');
    assert.equal(cli(['remove', 'steam']).code, 0);
    assert.equal(cli(['import', backup], 'wrong horse').code, 1);
    const imported = cli(['import', backup], 'correct horse');
    assert.equal(imported.code, 0, imported.stderr);
    assert.match(imported.stdout, /1 authenticator\(s\) imported/);
    assertCode(cli(['get', 'steam']).stdout, (ts) => steamCode(STEAM, ts));
  });

  await t.test('removes accounts', () => {
    assert.equal(cli(['remove', "bob's account"]).code, 0);
    assert.equal(cli(['get', "bob's account"]).code, 1);
    assert.equal(cli(['remove', "bob's account"]).code, 1);
  });
});
