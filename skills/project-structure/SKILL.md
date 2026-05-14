---
name: project-structure
description: Overview of the Trezor Suite monorepo structure and key directories. Use when navigating the codebase or deciding where to place new code.
---

# Project Structure

## Key (root) directories

- `suite` - Place where Web & Desktop only code is located.
- `suite-native` - Place where Mobile only code is located.
- `suite-common` - Shared code, that is domain specific, but can be used in all domain (Web/Desktop, Mobile).
- `packages`
    - The domain agnostic packages: libraries, tools, utils, etc.
    - `connect` - Trezor Connect (library for device communication)
    - `suite` - Shared logic for Suite applications
    - `suite-desktop` - Desktop application source
