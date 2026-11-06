---
name: project-structure
description: Overview of the Trezor Suite monorepo structure and key directories. Use when navigating the codebase or deciding where to place new code.
---

# Project Structure

## Key (root) directories

- `suite` - Place where Web & Desktop only code is located.
- `suite-app` - Web & Desktop application assembly (`@suite-app/*`).
    - `web-app` - Web application root
    - `desktop-app`, `desktop-app-main`, `desktop-app-renderer` - Desktop application (packaging, Electron main process, renderer)
    - `storybook` - Shared web/desktop component catalogue host
- `suite-native` - Place where Mobile only code is located.
- `suite-common` - Shared code, that is domain specific, but can be used in all domain (Web/Desktop, Mobile).
- `packages`
    - The domain agnostic packages: libraries, tools, utils, etc.
    - `connect` - Trezor Connect (library for device communication)
    - `suite` - Shared logic for Suite applications
