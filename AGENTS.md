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

# gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools directly.

Available gstack skills: `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/design-consultation`, `/design-shotgun`, `/design-html`, `/review`, `/ship`, `/land-and-deploy`, `/canary`, `/benchmark`, `/browse`, `/connect-chrome`, `/qa`, `/qa-only`, `/design-review`, `/setup-browser-cookies`, `/setup-deploy`, `/retro`, `/investigate`, `/document-release`, `/codex`, `/cso`, `/autoplan`, `/plan-devex-review`, `/devex-review`, `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/gstack-upgrade`, `/learn`

# Other Notes

- **Build times**: Initial setup takes 15-20 minutes; builds can take 10-15 minutes
- **Windows**: Use Git Bash instead of cmd/PowerShell; consider WSL for better performance
- **Testing**: Some tests may time out in CI environments without network access
- **Hardware wallets**: Use trezor/trezor-user-env emulator for development

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:

- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
