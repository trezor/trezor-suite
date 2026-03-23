# @trezor/requirements ✅

Simple checks for repository requirements on Nx-affected workspaces.

## What it does 🧩

- Verifies required repo rules.
- Can auto-fix issues, if the rule supports it.
    - If the rule doesn't support auto-fix, it will only verify _(similarly to eslint)_.

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
