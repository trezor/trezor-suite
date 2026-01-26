# Trezor Suite Development Guide

## Project Overview

Trezor Suite is a monorepo containing cryptocurrency wallet applications and developer tools:

- **Trezor Suite**: Web and desktop wallet application
- **Trezor Suite Mobile**: Mobile portfolio tracking app
- **Connect**: Hardware wallet integration library

The repository uses Yarn workspaces with 60+ packages and NX for build optimization.

## Setup Requirements

- **Node.js** (version specified in `.nvmrc`, use NVM: `nvm install`)
- **Yarn** (version specified in `package.json` packageManager field)
- **Git LFS** for binary assets
- **Git submodules** support

### Initial Setup

```bash
# Setup Git LFS and submodules
git submodule update --init --recursive
git lfs install
git lfs pull

# Install dependencies
nvm install
yarn  # Use --mode=skip-build if Playwright fails

# Build essential libraries (required before development)
yarn build:essential  # Allow 3-5 minutes for completion
```

## Development Commands

### Running Applications

```bash
yarn suite:dev             # Web app at http://localhost:8000
yarn suite:dev:desktop     # Desktop Electron app
yarn suite:dev:vite        # Development with Vite (faster hot reload)
```

### Code Quality

```bash
yarn lint                  # Lint JavaScript/TypeScript and styles
yarn lint:js:fix-files     # Auto-fix linting issues
yarn format                # Format code with Prettier
yarn type-check            # TypeScript type checking (10-15 minutes)
```

### Testing

```bash
yarn test:unit             # Run unit tests
yarn workspace @package-scope/package-name test:unit  # Test specific package
```

### Build Commands

```bash
yarn build:libs            # Build all libraries (required after dependency changes)
yarn suite:build:web       # Production web build
```

## Project Structure

### Key Directories

- `packages/suite-web/` - Web application source
- `packages/suite-desktop/` - Desktop application source
- `packages/suite/` - Shared Suite application logic
- `suite-native/` - Mobile application source
- `packages/connect/` - Connect library source
- `scripts/` - Build and maintenance scripts
- `docs/` - Project documentation

### Important Files

- `.nvmrc` - Required Node.js version
- `package.json` - Root package with yarn scripts and packageManager version
- `nx.json` - NX build configuration
- `eslint.config.mjs` - ESLint configuration
- `jest.config.base.js` - Jest test configuration

## Common Tasks

### Managing Dependencies

```bash
yarn workspace @trezor/package-name add dependency-name
yarn build:libs  # Rebuild after dependency changes
```

### Package Management

```bash
yarn generate-package      # Create new package
yarn update-submodules     # Update trezor-common submodule
```

### Troubleshooting

```bash
# Reset environment if builds fail
rm -rf node_modules .yarn/cache
yarn --mode=skip-build
yarn build:essential

# Clear NX cache
yarn nx reset

# Restart development server
pkill -f "webpack-dev-server"
yarn suite:dev
```

## Git and Commit Guidelines

**IMPORTANT**: This project uses [Conventional Commits](https://www.conventionalcommits.org/). All commits MUST follow this format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Commit Types and Scopes

- **feat**: New feature (e.g., `feat(suite): add transaction history export`)
- **fix**: Bug fix (e.g., `fix(components): resolve modal z-index issue`)
- **docs**: Documentation changes (e.g., `docs: update setup instructions`)
- **refactor**: Code refactoring without behavior change
- **test**: Adding or updating tests
- **chore**: Build process, dependencies, tooling (e.g., `chore(deps): update eslint`)

Common scopes: `suite`, `suite-native`, `connect`, `components`, `analytics`

### Commit Best Practices

- **Plan internally, commit only code**: For complex tasks, use todo lists or internal planning, but only commit actual code changes with conventional commits
- **If you must commit intermediate work**, use proper conventional commits (e.g., `chore: work in progress on feature X`) and be prepared to squash before final push
- Write clear, concise commit messages describing the actual change
- One logical change per commit when possible
- Reference issue numbers in commit body when applicable (e.g., `Closes #1234`)
- Avoid committing plan documents or TODO files unless they are part of the project documentation

## Development Notes

- **Build times**: Initial setup takes 15-20 minutes; builds can take 10-15 minutes
- **Windows**: Use Git Bash instead of cmd/PowerShell; consider WSL for better performance
- **Testing**: Some tests may timeout in CI environments without network access
- **Hardware wallets**: Use trezor/trezor-user-env emulator for development

## Common Issues

- **Playwright failures**: Use `yarn --mode=skip-build` during installation
- **Network timeouts**: Retry commands; common in restricted environments
- **Build failures**: Run `yarn build:libs` after dependency changes
- **Type errors**: Allow sufficient time for `yarn type-check` (10-15 minutes)
