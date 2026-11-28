---
name: github-issues
description: How to file a GitHub issue on trezor-suite. Short bug and feature bodies, issue types, live labels, and Suite project fields. Use when the user explicitly asks to create a GitHub issue.
---

# GitHub issues

File an issue only when the user explicitly asks. A review or a fix does not grant that.

This repository is `trezor/trezor-suite`. Firmware, firmware UX, clear-signing, bootloader, crypto library, trezorlib, protobuf, and device-level behavior belong on `trezor/trezor-firmware`, not here and not on the Suite project.

Start the body with the agent prefix from the [write rules](../github-write-actions/SKILL.md), then a blank line, then the template. No prefix in the title.

## Write

Widen the scope beyond the single report only when the root cause is known to be shared.

Bug reports stay short: only what is needed to understand and reproduce. No padding, no "N/A".

Never put a real name in the title or body. If context is needed, keep it generic, such as "observed during QA".

No assignee unless the user asks for one.

## Bug

Use the body of [the bug template](../../.github/ISSUE_TEMPLATE/02_Suite_bug.md). Omit every section and Info line you cannot fill. Put evidence images inline, next to the behavior they show.

## Feature

Omit any section you do not actually know.

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

Fetch the live labels with their descriptions and use only names from that list.

```bash
gh api repos/trezor/trezor-suite/labels --paginate --jq '.[] | "\(.name)\t\(.description // "")"'
```

Pick 2–4 area labels whose name or description matches the report. For a mobile or desktop issue, put "Mobile" or "Desktop" in the title.

Skip process labels, which track workflow state such as QA results, merges, backports, or releases rather than the affected area.

## Project fields

The issue goes into the org project [Suite](https://github.com/orgs/trezor/projects/58), number `58`, owner `trezor`. Resolve the field values now, before the confirm step. Set only what the report supports or what the user picked.

`gh` needs the `project` scope. If a project command fails for a missing scope, ask the user to run `gh auth refresh -h github.com -s project` and retry.

```bash
gh project field-list 58 --owner trezor --format json
```

- **Platform** — pick from `field-list`.
- **Team** — fetch the options with their descriptions. Set one only when exactly one description clearly matches the report. Set an option that has no description only when the report names that team.

    ```bash
    gh api graphql -f query='query{organization(login:"trezor"){projectV2(number:58){field(name:"Team"){... on ProjectV2SingleSelectField{options{name description}}}}}}' \
      --jq '.data.organization.projectV2.field.options[] | "\(.name)\t\(.description)"'
    ```

- **Priority** — leave unset unless the report explicitly names one or the user picks one. Do not infer it.
- **Release** — leave unset unless the report explicitly names a release or the user picks one. Do not infer it from version numbers or dates. It is an iteration: fetch the iterations and keep the `id` of the chosen one.

    ```bash
    gh api graphql -f query='query{organization(login:"trezor"){projectV2(number:58){field(name:"Release"){... on ProjectV2IterationField{configuration{iterations{id title}}}}}}}' \
      --jq '.data.organization.projectV2.field.configuration.iterations[] | "\(.id)\t\(.title)"'
    ```

- **Status** — never edit. New issues already get `🎯 To do`.

## Confirm, then create

Show the user the repo, title, type, labels, project fields, and body. Ask for each [project field](#project-fields) you could not fill: Platform, Team, Priority, Release. Team and Platform are required. Do not create the issue until both are set, either by you from the report or by the user. Leave Priority and Release unset if the user skips them. Create only after they approve.

```bash
gh issue create \
  --repo trezor/trezor-suite \
  --title "..." \
  --body-file ./body.md \
  --type <Bug|Feature|Task> \
  --label <label> --label <label>
```

When the issue has images, write the body and the media into one temp directory and run `gh` from there. Reference each file inline as `![short alt](./screenshot-1.png)` and pass that same path to `--attach`, or `gh` appends unreferenced files at the end. GitHub MCP cannot upload attachments. Do not commit screenshots into the repo to get a URL. Share the issue URL and delete the temp directory afterward.

## Add to the project

Add the issue and set each resolved field, one `item-edit` per field. Pass each option `name` exactly, emoji included. Re-read `field-list` if an edit is rejected.

```bash
gh project item-add 58 --owner trezor --url "$ISSUE_URL"
gh project item-edit 58 --owner trezor --url "$ISSUE_URL" --field <field> --value "<option name>"
gh project item-edit 58 --owner trezor --url "$ISSUE_URL" --field Release --iteration-id <iteration id>
```

If `item-edit` rejects `--field`, ask the user to upgrade gh (needs 2.97+).

## Attachments and confidential data

Do not attach a screenshot that shows seed words, a PIN, a passphrase, or a wipe code. Ask for a crop if that is the only shot.

Addresses, balances, txids, and account labels are fine in screenshots from public QA and dev wallets, where most Suite issues come from. For any other wallet, ask for a crop without them. Do not copy those values into the issue text. The screenshot is the evidence.

Attach only images that evidence the report.
