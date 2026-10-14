---
name: github-issues
description: How to file a GitHub issue on trezor-suite. Short bug and feature bodies, issue types, live labels, and Suite project fields. Use when the user explicitly asks to create a GitHub issue.
---

# GitHub issues

File an issue only when the user explicitly asks. A review or a fix does not grant that.

This repository is `trezor/trezor-suite`. Firmware, bootloader, crypto library, trezorlib, protobuf, and device-level behavior belong on `trezor/trezor-firmware`, not here and not on the Suite project.

Start the body with the agent attribution prefix required by the repository workflow. First line of the description, then a blank line, then the template. Titles stay free of that prefix and of real names.

## Write

Distill the underlying problem. Generalize when the root cause clearly applies more broadly than the single report.

Bug reports stay short: only what is needed to understand and reproduce. No padding, no "N/A", no Additional Context, no Environment dump. The web form in `.github/ISSUE_TEMPLATE` is for people filing through GitHub. Do not copy its extra sections into an agent-filed issue.

Never put a real name in the title or body. Omit attribution. If context is needed, keep it generic, such as "observed during QA".

No assignee unless the user asks for one. Prefer shorter. If in doubt, cut.

## Bug

Omit Steps when they are unknown. Keep Expected and Actual to one short line each. Put evidence images inline, next to the behavior they show.

```markdown
### Description

<1-2 sentences: what's broken>

### Steps to Reproduce

1. ...

### Expected Behavior

<one short line>

### Actual Behavior

<one short line>
```

## Feature

Slightly fuller. Omit any section you do not actually know.

```markdown
## Summary

<what should change>

## Use Case

<why>

## Expected Behavior

<one short paragraph>
```

## Labels and type

Kind is a GitHub issue type: `Bug`, `Feature`, or `Task`. Never a `bug` label.

Fetch the live label list before proposing any. Do not pick from memory. Drop any name that is missing. Never invent a label.

```bash
gh api repos/trezor/trezor-suite/labels --paginate --jq '.[].name'
```

Pick 2–4 existing area labels, such as `trading`, `copy`, `UI`, `connect`, `EVM`, `send`, `receive`, `desktop`, `web`. There is no `mobile` label. Put "Mobile" in the title instead.

Skip process labels: `conveyor:*`, `QA OK`, `QA NOK`, `cherry-pick🍒`, `release:*`.

## Confirm, then create

Show the user the repo, title, type, labels, project fields, and body. Create only after they approve.

Use `gh issue create`. Repeat `--label` as needed.

```bash
gh issue create \
  --repo trezor/trezor-suite \
  --title "..." \
  --body-file ./body.md \
  --type Bug \
  --label UI --label trading
```

`--type` is `Bug`, `Feature`, or `Task`.

When the issue has images, write the body and the media into one temp directory and run `gh` from there. Reference each file inline as `![short alt](./screenshot-1.png)` and pass that same path to `--attach`, or `gh` appends unreferenced files at the end. GitHub MCP cannot upload attachments. Do not commit screenshots into the repo to get a URL. Share the issue URL and delete the temp directory afterward.

## Suite project

After the issue exists, add it to the org project titled **Suite** (`--owner trezor`). Resolve the project number with `gh project list`. `gh` needs the `project` scope. If a project command fails for a missing scope, ask the user to run `gh auth refresh -h github.com -s project` and retry.

List fields before choosing values. Pass each option `name` exactly, emoji included. One `item-edit` per field. Set only what the report supports. Re-read `field-list` if an edit is rejected.

```bash
gh project field-list <number> --owner trezor --format json
gh project item-add <number> --owner trezor --url "$ISSUE_URL"
gh project item-edit <number> --owner trezor --url "$ISSUE_URL" --field Platform --value "📱 Mobile"
```

Name-based `item-edit` (`--url`, `--field`, `--value`) needs gh 2.97 or newer, from July 2026. `field-list` and `item-add --url` are older. If `item-edit` rejects `--field`, ask the user to upgrade gh.

Never edit **Status**. New issues already get `🎯 To do`.

- **Platform** — `🖥️ Desktop`, `📱 Mobile`, `🖥️📱Suite`, `🔌 Connect`, `⚙️ Trading-backend`, `🔧 Dependencies`.
- **Team** — set only when the report clearly matches one option. Leave it unset otherwise.
    - `Suite-Wallet 👛` — accounts, send/receive, tx history, passphrase, signing UX, labeling, Suite Sync, mobile portfolio.
    - `Suite-Trade 💹` — buy/sell/swap, the trading flow, trading backends, RWAs, message system.
    - `Suite-Earn 🐷` — staking, yield, the in-app browser, MEV/GSS.
    - `Suite-Networks 🌐` — chains and tokens, fiat rates, RPC/backends, backend tx fees, tx simulation, name resolution.
    - `Suite-Growth 🎨` — onboarding, banners/popups, notifications, settings, device settings, FW-update UI, analytics, Electron, Suite Guide.
    - `Connect devs 🔌` — device transport, Bluetooth/THP, the 3rd-party Connect API, WalletConnect API, Connect modularization, Tor.
    - `DevOps ⛓` — CI/CD and platform support.
    - `Suite-performance-wg ⚡️`, `QA 🧪`, `Backends`, `Other` — set one only when the report names that team.
- **Priority** — leave unset unless the report explicitly names one. Do not infer it. Options: `LOW 🧊`, `MEDIUM 🌿`, `HIGH🔥`.
- **Release** — leave unset unless the report explicitly names a release. Do not infer it from version numbers or dates. It is an iteration. Set it with `--iteration-id` from the field list, not `--value`.

Firmware UX, clear-signing, and FW modularization belong on `trezor-firmware`, not a Suite team. Localization and Sentry have no Team option. Leave Team unset.

## Attachments and confidential data

Do not attach a screenshot that shows seed words, a PIN, a passphrase, or a wipe code. Ask for a crop if that is the only shot.

Addresses, balances, txids, and account labels are fine in screenshots. Most Suite issues come from public QA and dev wallets. Do not copy those values into the issue text. The screenshot is the evidence.

Attach only images that evidence the report. Skip memes, unrelated photos, and duplicates.
