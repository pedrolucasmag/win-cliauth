# win-cliauth

win-cliauth is a CLI-based OTP (One-Time Password) authenticator management tool for Windows.

## Installation

You can install win-cliauth globally using npm:

npm install -g win-cliauth

## Usage

win-cliauth provides a command-line interface for managing OTP (One-Time Password) authenticators. It supports the following commands:

- `add <name> <secret-key>`: Adds an authenticator with the given name and secret key.
- `add <name> <secret-key> --replace`: Adds an authenticator, replacing an existing one with the same name.
- `remove <name>`: Removes the authenticator with the specified name.
- `get <name>`: Retrieves the token from the authenticator with the specified name.
- `get <name> --steam`: Retrieves the token from the Steam authenticator with the specified name.
- `get <name> --clipboard`: Retrieves the token and adds it to the clipboard.
- `list`: Lists all registered authenticators.
- `list --showsecret`: Lists all registered authenticators, including the secret keys.

To use win-cliauth, open a terminal or command prompt and run one of the commands listed above.

For detailed information on the available commands and options, you can run:

win-cliauth --help

## Security

- win-cliauth encrypts the secret keys using the `ConvertTo-SecureString` command in PowerShell before storing them on disk.
- The secret keys are stored in an encrypted file in the user's data directory, protected by the user's operating system.
- Please note that the encrypted file can only be read on the same Windows user account where it was created. It may not be readable on other user accounts or operating systems.

## Credits

This project uses the following open-source libraries:

- [otpauth](https://github.com/hectorm/otpauth) - One Time Password (HOTP/TOTP) library for Node.js, Deno, Bun and browsers.
- [steam-totp](https://github.com/DoctorMcKay/node-steam-totp) - A Node.js library for generating Steam-compatible 2FA tokens.
- [yargs](https://github.com/yargs/yargs) - A command-line argument parsing library for Node.js.

Please refer to the respective library documentation for detailed information on their usage, licensing, and contributions.


## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please feel free to open an issue or submit a pull request on [GitHub](https://github.com/pedrolucasmag/win-cliauth).

## License

This project is licensed under the BSD-3-Clause License. See the LICENSE file for details.