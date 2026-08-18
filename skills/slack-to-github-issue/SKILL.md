---
name: slack-to-github-issue
description: "Converts a Slack thread (given as a Slack message/thread URL, or pasted Slack conversation text) into a well-structured GitHub issue on a Trezor repository. Use this skill whenever the user pastes a Slack thread link (e.g. https://satoshilabs.slack.com/archives/...) or Slack conversation and wants it turned into a GitHub issue, bug report, or feature request. Also trigger on phrases like \"turn this thread into an issue\", \"file this as a github issue\", or \"make an issue from this slack conversation\"."
---

# Slack Thread → GitHub Issue

Turns a Slack thread into a clean, de-identified GitHub issue on `trezor/trezor-suite` or `trezor/trezor-firmware`.

## Workflow

### 1. Read the Slack thread

- Parse the channel ID and message timestamp from the URL (format: `.../archives/<CHANNEL_ID>/p<TS>`). The `p<TS>` needs a decimal point inserted 6 digits from the end to become a valid Slack `ts` (e.g. `p1782986606856769` → `1782986606.856769`).
- Use the Slack thread-reading tool to fetch the parent message and all replies.
- If the user pasted raw conversation text instead of a link, just use that directly — skip the Slack tool call.
- If any image/screenshot is attached and the user hasn't described it, ask them to upload it (or describe it) before drafting, since screenshots often contain the actual bug/error text.

### 2. Determine the repository and issue type

- `trezor/trezor-suite` — desktop/web/mobile app, UI, onboarding, send/receive, trading (buy/sell/swap), settings, Connect.
- `trezor/trezor-firmware` — firmware, bootloader, crypto library, trezorlib, protobuf, device-level behavior.
- Bug report vs. feature request — infer from the conversation; ask only if genuinely ambiguous.

### 3. Draft the issue — bare minimum

- Distill the Slack back-and-forth into the *actual underlying problem*, not a transcript.
- Generalize beyond the single reported instance when the root cause clearly applies more broadly.
- **Bug reports must be short.** Only what's needed to understand and reproduce. No padding, no "N/A", no Additional Context section.
- **Never include real names** in the title or body — omit attribution entirely. If context is needed, keep it generic (e.g. "observed during QA").
- Bug report template (omit Steps if unknown; keep Expected/Actual to one short line each):
```markdown
### Description
<1-2 sentences: what's broken>

### Steps to Reproduce
1. ...
2. ...

### Expected Behavior
<one short line>

### Actual Behavior
<one short line>
```
- Feature requests stay slightly fuller: `## Summary`, `## Use Case`, `## Expected Behavior` (omit anything unknown).

### 4. Labels

Pick 2-4 labels max from the trezor-suite / trezor-firmware label sets (bug/feature plus relevant area, e.g. `trading`, `copy`, `UI`, `connect`, `EVM`, `mobile`, `desktop`). Don't invent labels.

### 5. Confirm, then create

- Show the user: repo, title, labels, body. Ask for confirmation.
- On approval, create the issue using the GitHub MCP tool (`github:issue_write` with `method: "create"`), not the `gh` CLI (no local auth is available for `gh`).
- Share the resulting issue URL.

### 6. Defaults

- If the user doesn't specify, default to no assignee.
- Prefer shorter over more complete. If in doubt, cut.
