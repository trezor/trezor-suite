## Skills

**All skills are mandatory reading** before making changes.

- [Basic Syntax](skills/basic-syntax/SKILL.md) – If-else, ternaries, and other syntax rules
- [Code Style Guide](skills/skills-and-code-style-contribution/SKILL.md) – How to contribute code style proposals
- [Comments](skills/comments/SKILL.md) – Comment formatting conventions
- [Common Issues](skills/common-issues/SKILL.md) – Known issues and their solutions
- [Components](skills/components/SKILL.md) – React component file structure and patterns
- [Common Tasks](skills/common-tasks/SKILL.md) – Dependency management, package creation, and troubleshooting
- [Defensive Programming](skills/defensive-programming/SKILL.md) – Exhaustive checks and safe defaults
- [Development Commands](skills/development-commands/SKILL.md) – Running apps, linting, testing, and building
- [Git and Commit Guidelines](skills/git-and-commit-guidelines/SKILL.md) – Conventional Commits format and best practices
- [Import/Export](skills/import-export/SKILL.md) – Named exports and import ordering
- [Naming](skills/naming/SKILL.md) – Naming conventions for variables, functions, and files
- [Packages](skills/packages/SKILL.md) – How to create and structure packages
- [Project Overview](skills/project-structure/SKILL.md) – What Trezor Suite is and how the monorepo is organized
- [Publish Config](skills/publish-config/SKILL.md) – publishConfig rules for public npm packages
- [Redux](skills/redux/SKILL.md) – Redux Toolkit patterns and best practices
- [Setup Requirements](skills/setup-requirements/SKILL.md) – Prerequisites and initial environment setup
- [Tests](skills/tests/SKILL.md) – Test style guidelines and best practices
- [Tests Commands](skills/tests-commands/SKILL.md) – Running tests and test-related guidelines
- [Tests Common](skills/tests-common/SKILL.md) – TDD practices for suite-common packages
- [Tests Native](skills/tests-native/SKILL.md) – TDD practices for suite-native packages
- [TypeScript](skills/typescript/SKILL.md) – TypeScript-specific conventions

# Confidential data — never send it off the device

Account/device confidential data must never leave the device to any external sink (analytics, Sentry, off-device logging, breadcrumbs, request URLs, any remote endpoint). Trace the actual value at the call site, not just the field type, and check the whole repo for outbound reporting.

Confidential (see `redactAccount`/`redactDevice` in `suite-common/logger/src/utils.ts`): device id/label/state, static session id, `session_id`; account descriptor/xpub/key, addresses, UTXOs, txids; exact balances/amounts; labels and free-form user text; passphrase/seed/PIN/wipe code.

# Other Notes

- **Build times**: Initial setup takes 15-20 minutes; builds can take 10-15 minutes
- **Windows**: Use Git Bash instead of cmd/PowerShell; consider WSL for better performance
- **Testing**: Some tests may time out in CI environments without network access
- **Hardware wallets**: Use trezor/trezor-user-env emulator for development
