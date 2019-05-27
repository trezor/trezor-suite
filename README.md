# Trezor Suite

![img](https://repository-images.githubusercontent.com/148657224/439f6100-765f-11e9-9bff-b725eef3c4a6)

Projects:
- @trezor/components
- @trezor/suite
- @trezor/suite-desktop
- @trezor/suite-native

## Development
To build react-native application start by following these instructions. Select `React Native CLI Quickstart` and install all required dependencies.
https://facebook.github.io/react-native/docs/getting-started

- `git clone git@github.com:trezor/trezor-suite.git`
- `yarn`
- `yarn suite:dev`

To enable ESLint on typescript files in VS Code add following lines to your settings (`Preferences -> Settings`)
```
"eslint.validate": [
    "javascript",
    "javascriptreact",
    {
        "language": "typescript",
        "autoFix": true
    },
    {
        "language": "typescriptreact",
        "autoFix": true
    }
]
```

## Contribute

Inspired by [GitLab Contributing Guide](https://docs.gitlab.com/ee/development/contributing/)

### Security vulnerability disclosure

Please report suspected security vulnerabilities in private to [security@satoshilabs.com](mailto:security@satoshilabs.com), also see [the disclosure section on the Trezor.io website](https://trezor.io/security/). Please do NOT create publicly viewable issues for suspected security vulnerabilities.

### Issue Labels

#### Priority

Label     | Meaning (SLA)
----------|--------------
P1 Urgent | The current release + potentially immediate hotfix (30 days)
P2 High   | The next release (60 days)
P3 Medium | Within the next 3 releases (90 days)
P4 Low    | Anything outside the next 3 releases (120 days)

#### Severity

Label       | Impact
------------|-------
S1 Blocker  | Outage, broken feature with no workaround
S2 Critical | Broken feature, workaround too complex & unacceptable
S3 Major    | Broken feature, workaround acceptable
S4 Low      | Functionality inconvenience or cosmetic issue


