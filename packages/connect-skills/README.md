# @trezor/connect-skills

AI agent skills for integrating `@trezor/connect` into third-party applications.

Each skill is a self-contained markdown file covering a specific integration topic.
Point your AI coding assistant at the relevant skill(s) before writing Trezor integration code.

## Skills

| File                                                               | Topic                                                               |
| ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| [skills/overview.md](skills/overview.md)                           | Package selection, initialization, response pattern, key concepts   |
| [skills/events.md](skills/events.md)                               | DEVICE_EVENT, TRANSPORT_EVENT, BLOCKCHAIN_EVENT, UI_EVENT           |
| [skills/methods.md](skills/methods.md)                             | API methods reference (getAddress, signTransaction, Ethereum, etc.) |
| [skills/device-model.md](skills/device-model.md)                   | Device types, models, firmware status, capabilities, multi-device   |
| [skills/error-handling.md](skills/error-handling.md)               | Error codes, handling patterns, call serialization                  |
| [skills/typescript.md](skills/typescript.md)                       | Type imports, response narrowing, method overloads                  |
| [skills/platform-node.md](skills/platform-node.md)                 | Node.js + Trezor Bridge setup, UI handling                          |
| [skills/platform-web.md](skills/platform-web.md)                   | Browser app, WebUSB, popup, bundler config                          |
| [skills/platform-webextension.md](skills/platform-webextension.md) | MV3 extension, service worker, externally_connectable               |
| [skills/platform-electron.md](skills/platform-electron.md)         | Electron main process, IPC, NodeUSB                                 |
| [skills/platform-mobile.md](skills/platform-mobile.md)             | React Native, deep links, Expo setup                                |

## Quick Start

Start with [skills/overview.md](skills/overview.md) to pick the right package for your environment,
then reference the platform skill and any method-specific skills you need.

## Related

- Interactive API explorer: https://connect.trezor.io/
- Code examples: [`packages/connect-examples/`](../connect-examples/)
- Package docs: [`packages/connect/README.md`](../connect/README.md)
