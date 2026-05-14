---
name: setup-requirements
description: Prerequisites and initial environment setup for the Trezor Suite monorepo, including Node.js, Yarn, Git LFS, and submodules. Use when setting up or troubleshooting the development environment.
---

# Setup Requirements

- **Node.js** (version specified in `.nvmrc`, use NVM: `nvm install`)
- **Yarn** (version specified in `package.json` packageManager field)
- **Git LFS** for binary assets
- **Git submodules** support

## Initial Setup

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
