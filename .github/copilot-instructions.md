# Trezor Suite Development Guide

## Project Overview

Trezor Suite is a monorepo containing cryptocurrency wallet applications and developer tools:

- **Trezor Suite**: Web and desktop wallet application
- **Trezor Suite Lite**: Mobile portfolio tracking app
- **Connect**: Hardware wallet integration library

The repository uses Yarn workspaces with 60+ packages and NX for build optimization.

## Setup Requirements

- **Node.js 22.11.0** (use NVM: `nvm install`)
- **Yarn 4.5.3** (install with: `npm install -g yarn`)
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

# Build libraries (required before development)
yarn build:libs  # Allow 5-10 minutes for completion
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

- `.nvmrc` - Required Node.js version (22.11.0)
- `package.json` - Root package with yarn scripts
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
yarn build:libs

# Clear NX cache
yarn nx reset

# Restart development server
pkill -f "webpack-dev-server"
yarn suite:dev
```

## Development Notes

- **Build times**: Initial setup takes 15-20 minutes; builds can take 10-15 minutes
- **Windows**: Use Git Bash instead of cmd/PowerShell; consider WSL for better performance
- **Testing**: Some tests may timeout in CI environments without network access
- **Hardware wallets**: Use trezor/trezor-user-env emulator for development
- **Commit format**: Use Conventional Commits (e.g., `feat(suite):`, `fix(components):`, `docs:`)

## Common Issues

- **Playwright failures**: Use `yarn --mode=skip-build` during installation
- **Network timeouts**: Retry commands; common in restricted environments
- **Build failures**: Run `yarn build:libs` after dependency changes
- **Type errors**: Allow sufficient time for `yarn type-check` (10-15 minutes)
