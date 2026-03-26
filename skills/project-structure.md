# Project Structure

## Top-level layers

- `packages/`
    - Domain-agnostic packages only.
    - Put libraries, tools, utils, and other code here only when it is not Suite-domain specific.
- `suite-common/`
    - Shared Suite domain logic.
    - Put code here when it is shared by web, desktop, and mobile Suite.
    - There should be no platform-specific code in `@suite-common`
- `suite/`
    - Web/desktop Suite packages.
    - Put code here when it is specific to web and/or desktop Suite.
- `suite-native/`
    - Mobile Suite packages.
    - Put code here when it is specific to native/mobile Suite.
