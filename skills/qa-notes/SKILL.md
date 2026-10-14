---
name: qa-notes
description: How to write the Notes for QA section of a Trezor Suite pull request. Use when creating or editing a pull request description.
---

# Notes for QA

Notes for QA list only the areas of the app to focus on. Nothing more.

QA tests the app as a user and usually does not read the diff. The linked issue often already names the areas, so leave this section empty unless the pull request affects somewhere the issue does not mention.

## Write

- A few short bullets a tester can find in the app, such as "mobile cold start with saved wallets" or "Bitcoin send form".
- Stop after the area names. Leave out steps, scenarios, build types, tools, causes, and side effects.

## Example

```markdown
## Notes for QA

- Mobile app startup with saved wallets
```

## Anti-example

Steps, a cause, and a skip list. Write the example above instead.

```markdown
## Notes for QA

- Kill the mobile app, reopen it with a saved wallet, and confirm the home screen lists those wallets
- Caused by wallet discovery after a cold start. Desktop and web do not share this path
- No need to test send or trading
```
