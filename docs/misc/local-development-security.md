# Local development security

Given the emerging supply chain attacks, it is not enough to rely on CI security checks.
Those only safeguard CI itself, and prevent merging compromised code to `develop`.
Additional hardening for local development is highly recommended for developers to work safely with npm packages (adding new npm packages, updating existing ones).

## PMG by SafeDep

`pmg` is a tool that wraps yarn, and scans packages that are being fetched from npm registry for known malicious code. <br />
PMG was chosen because it is fully open source, with permissible license, works well with `yarn` and can easily be built from source. <br />
You can refer to [the official documentation](https://github.com/safedep/pmg) for more details.

See their [Quick start README](https://github.com/safedep/pmg#quick-start) for setup instructions.<br />
Note that building from source is a viable option.

You can test it by running `yarn add safedep-test-pkg@0.1.3` (PMG blocks the package as if it was malicious).

### Alternatives

- [SFW was explored previously](https://github.com/trezor/trezor-suite/blob/abe28a77db45dd843fbc3bf51cb052d53515ab83/docs/misc/local-development-security.md#socket-firewall-free), but rejected due to being closed source and higher setup complexity.
- [DataDog firewall](https://github.com/DataDog/supply-chain-firewall) was rejected because it doesn't support `yarn`
