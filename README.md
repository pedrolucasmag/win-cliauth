# win-cliauth

win-cliauth is a CLI-based OTP (One-Time Password) authenticator management tool for Windows.

## Installation

You can install win-cliauth globally using npm:

npm install -g win-cliauth

## Usage

win-cliauth provides a command-line interface for managing OTP (One-Time Password) authenticators. It supports the following commands:

- `add <name>`: Adds an authenticator, prompting for the secret key without echoing it (it can also be piped through stdin).
- `add <name> <secret-key>`: Same, with the secret on the command line (note: it stays in your shell history).
- `add <name> --replace`: Adds an authenticator, replacing an existing one with the same name.
- `add <name> --steam`: Adds a Steam Guard authenticator (see [Steam Guard](#steam-guard)).
- `add <name> --mafile <path>`: Imports a Steam Guard authenticator from a `.maFile`.
- `remove <name>`: Removes the authenticator with the specified name.
- `get <name>`: Retrieves the token and shows how many seconds it stays valid. Any unique start of the name works, in any case (`get micro` for `microsoft`). If the code is about to expire, it waits for the next one.
- `get <name> --clipboard`: Retrieves the token and adds it to the clipboard, clearing it again after 30 seconds (`--clear <seconds>` to change, `--clear 0` to keep it).
- `get <name> --sync`: Forces a fresh time sync before generating the token.
- `get <name> --watch`: Keeps the code on screen with a countdown bar, switching to the next code as it changes, until Ctrl+C.
- `list`: Lists all registered authenticators.
- `list --showsecret`: Lists all registered authenticators, including the secret keys.
- `rename <old-name> <new-name>`: Renames an authenticator.
- `export <file>`: Saves all authenticators to a password-protected backup file (see [Backups](#backups)).
- `import <file>`: Adds the authenticators from a backup file; existing names are kept unless `--replace` is given.

The secret key can be a base32 secret or an `otpauth://totp/...` URI (its digits, period and algorithm are respected).

Commands exit with a non-zero code when they fail (e.g. authenticator not found), so they can be used in scripts. When the output is not a terminal, `get` prints only the code.

win-cliauth checks npm at most once a day and tells you when a newer version is available. Set `WIN_CLIAUTH_NO_UPDATE_CHECK=1` to turn this off.

To use win-cliauth, open a terminal or command prompt and run one of the commands listed above.

For detailed information on the available commands and options, you can run:

win-cliauth --help

## Steam Guard

Steam Guard authenticators can be imported from a `.maFile`:

```
win-cliauth add steam --mafile path\to\account.maFile
```

Encrypted `.maFile`s must be decrypted before importing. You can also add the secret directly with `add steam --steam`; it can be a base64 `shared_secret`, base32 secret, `steam://` value or `otpauth://` URI. Steam codes are synced against Steam's own time server.

Anyone with your `shared_secret` can generate your Steam Guard codes, so keep `.maFile`s private and don't leave them lying around after importing (see [Backups](#backups)).

## Security

- Secret keys are encrypted with Windows DPAPI (`ConvertTo-SecureString` / `ConvertFrom-SecureString` in PowerShell) before being stored on disk. They are passed to PowerShell through stdin, never on the command line.
- The encrypted file lives in `%AppData%\win-cliauth\keys` and is written atomically; the previous version is kept as `keys.bak`.
- The encrypted file can only be read by the same Windows user account where it was created.
- Time is synced over HTTPS (Google for TOTP, Steam for Steam Guard) and the offset is cached for 6 hours in `%AppData%\win-cliauth\time.json`.

## Backups

The vault is tied to your Windows user account: reinstalling Windows or switching accounts makes it unreadable, even if you copied the `keys` file. Before that happens, make a backup:

```
win-cliauth export D:\backup\win-cliauth.json
```

The file is encrypted with the password you choose (scrypt + AES-256-GCM), so it can be kept on a USB drive or in cloud storage, and restored on any PC or account with `win-cliauth import`. Without the password it cannot be restored, so keep the password safe too, along with each service's recovery codes, such as the Steam revocation code from your `.maFile`.

win-cliauth is provided without warranty; see the [license](LICENSE).

## Credits

This project uses the following open-source libraries:

- [yargs](https://github.com/yargs/yargs) - A command-line argument parsing library for Node.js.

Please refer to the respective library documentation for detailed information on their usage, licensing, and contributions.


## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please feel free to open an issue or submit a pull request on [GitHub](https://github.com/pedrolucasmag/win-cliauth).

## License

This project is licensed under the BSD-3-Clause License. See the LICENSE file for details.