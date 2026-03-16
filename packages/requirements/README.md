# @trezor/requirements ✅

Simple checks for repository requirements on Nx-affected workspaces.

## What it does 🧩

- Verifies required repo rules.
- Can auto-fix supported issues.

## Usage 🚀

From repo root:

```bash
yarn workspace @trezor/requirements requirements:verify
yarn workspace @trezor/requirements requirements:fix
```

Optional flags:

```bash
# Run only one requirement by name
yarn workspace @trezor/requirements requirements:verify --only=package-json

# Limit to affected workspaces containing the given text
yarn workspace @trezor/requirements requirements:verify --filter=@trezor/connect
```
