# Changelog

All notable changes to this project will be documented in this file. See [Conventional Commits](https://www.conventionalcommits.org) for commit guidelines.

## [1.1.1](https://github.com/pedrolucasmag/win-cliauth/compare/v1.1.0...v1.1.1) (2026-10-25)


### Bug Fixes

* **deps:** bump yargs from 17.7.3 to 18.2.0 ([3d264bd](https://github.com/pedrolucasmag/win-cliauth/commit/3d264bd7d51a9eec0e0f88fb6f91e75cf059a38e))
* **deps:** bump yargs from 17.7.3 to 18.2.0 ([781bc01](https://github.com/pedrolucasmag/win-cliauth/commit/781bc014e899febdfef3c2ef69b399c28edae71b))
* require Node 20.19+ or 22.12+, as yargs 18 does ([fa7c196](https://github.com/pedrolucasmag/win-cliauth/commit/fa7c196246840e3826ac0c37ad5c791cea082139))
* require Node 20.19+ or 22.12+, as yargs 18 does ([e2da400](https://github.com/pedrolucasmag/win-cliauth/commit/e2da400d5aec347d514fd49daee5d47e968c9c49))

## [1.1.0](https://github.com/pedrolucasmag/win-cliauth/compare/v1.0.5...v1.1.0) (2026-10-10)


### Features

* clear the clipboard 30 seconds after get --clipboard (--clear to change) ([c96ecb2](https://github.com/pedrolucasmag/win-cliauth/commit/c96ecb253dabca6315bc4e15bcd7be025d65ac6f))
* encrypted export/import, time left, clipboard clearing, prefix matching, rename, update notice ([4bea1a7](https://github.com/pedrolucasmag/win-cliauth/commit/4bea1a7653e42a83cc64c505d0d0ce55085e73ce))
* get --watch ([04fc781](https://github.com/pedrolucasmag/win-cliauth/commit/04fc78160c3191af5ca86f6cc508743687bd81cd))
* get --watch keeps the code on screen with a countdown bar until Ctrl+C ([7a86a82](https://github.com/pedrolucasmag/win-cliauth/commit/7a86a82098dae028e5ae139516290cfd52f9691d))
* get accepts a case-insensitive unique prefix of the name ([c96ecb2](https://github.com/pedrolucasmag/win-cliauth/commit/c96ecb253dabca6315bc4e15bcd7be025d65ac6f))
* password-protected export and import of the vault ([c96ecb2](https://github.com/pedrolucasmag/win-cliauth/commit/c96ecb253dabca6315bc4e15bcd7be025d65ac6f))
* rename command ([c96ecb2](https://github.com/pedrolucasmag/win-cliauth/commit/c96ecb253dabca6315bc4e15bcd7be025d65ac6f))
* show how long a code stays valid and wait for a fresh one when it is about to expire ([c96ecb2](https://github.com/pedrolucasmag/win-cliauth/commit/c96ecb253dabca6315bc4e15bcd7be025d65ac6f))
* support counter-based (HOTP) authenticators ([4ffccb5](https://github.com/pedrolucasmag/win-cliauth/commit/4ffccb53ed4e51d4fee36fd3775ec9e3242231e8))
* tell the user when a newer version is available on npm ([c96ecb2](https://github.com/pedrolucasmag/win-cliauth/commit/c96ecb253dabca6315bc4e15bcd7be025d65ac6f))

## [1.0.5](https://github.com/pedrolucasmag/win-cliauth/compare/v1.0.4...v1.0.5) (2026-10-05)


### Bug Fixes

* save the vault when run from PowerShell 7 ([d2c4271](https://github.com/pedrolucasmag/win-cliauth/commit/d2c427104717d68f2fe420389de5249d610a1cdc))
* treat built-in property names as ordinary account names ([c3e4dcb](https://github.com/pedrolucasmag/win-cliauth/commit/c3e4dcbe26ecf07324470ef2fd922c40ad1335ac))

## [1.0.4](https://github.com/pedrolucasmag/win-cliauth/compare/v1.0.3...v1.0.4) (2026-10-03)


### Bug Fixes

* harden vault I/O, time sync and Steam Guard support ([ee40934](https://github.com/pedrolucasmag/win-cliauth/commit/ee40934c0280b4248c1b0b7ddce96172676c9055))

## 1.0.3 (2023-08-14)


### Features

* implements proper time sync, ref: https://github.com/winauth/winauth/issues/575 ([f2689e7](https://github.com/pedrolucasmag/win-cliauth/commit/f2689e7d5a6059b3990b76638d312e9b02642efd))


### Bug Fixes

* Replace exec with spawn for async processing in decrypt function ([fbff3ad](https://github.com/pedrolucasmag/win-cliauth/commit/fbff3ad7a6a064fb983a181bf17aaefb9f1ace58))


### Miscellaneous Chores

* release 1.0.3 ([015247d](https://github.com/pedrolucasmag/win-cliauth/commit/015247d9f77aa6f498bd68d1427facd738b592db))

### 1.0.2 (2023-08-04)

### Bug Fixes

* Replace exec with spawn for async processing in decrypt function ([fbff3ad](https://github.com/pedrolucasmag/win-cliauth/commit/fbff3ad7a6a064fb983a181bf17aaefb9f1ace58))
