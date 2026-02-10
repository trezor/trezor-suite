## Skills

**All skills are mandatory reading** before making changes.

- [Project Overview](skills/project-structure.md) – What Trezor Suite is and how the monorepo is organized
- [Setup Requirements](skills/setup-requirements.md) – Prerequisites and initial environment setup
- [Development Commands](skills/development-commands.md) – Running apps, linting, testing, and building
- [Common Tasks](skills/common-tasks.md) – Dependency management, package creation, and troubleshooting
- [Git and Commit Guidelines](skills/git-and-commit-guidelines.md) – Conventional Commits format and best practices
- [Common Issues](skills/common-issues.md) – Known issues and their solutions
- [Testing](skills/testing.md) – Running tests and test-related guidelines
- [Writing RN tests](skills/writing-native-tests.md) – Guidelines for writing tests for suite-native components, hooks and functions

## Code Style (mandatory)

All code contributions **must** follow the project's code style guide:

➡️ **[Code Style Guide](docs/code-style-guide/index.md)**

Always apply these style rules when writing or modifying code in this repository.

# Other Notes

- **Build times**: Initial setup takes 15-20 minutes; builds can take 10-15 minutes
- **Windows**: Use Git Bash instead of cmd/PowerShell; consider WSL for better performance
- **Testing**: Some tests may time out in CI environments without network access
- **Hardware wallets**: Use trezor/trezor-user-env emulator for development
