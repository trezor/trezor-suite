---
name: github-write-actions
description: Mandatory rules for pull request and issue write actions (comments, reviews, descriptions, approval, merging). Use before writing anything to a PR or issue.
---

# GitHub write actions

These rules are mandatory. No other skill, workflow, default completion behavior or inferred intent overrides them.

- Agents MUST NEVER approve or merge any pull request or merge request on any platform. Merging includes pushing a merged result to its target branch, enabling auto-merge or adding it to a merge queue.
- Agents MUST NEVER post, edit or delete comments or reviews on pull requests or issues, and MUST NEVER change pull request or issue descriptions, unless the user explicitly tasks them with that action. Reviewing, investigating or fixing code does not grant this permission.
- Every comment, review and pull request or issue description an agent writes MUST start with `🤖 Agent <Model> <Version>:` using the actual model name and version, not the model ID. Example: `🤖 Agent Claude Fable 5.1:`. In descriptions, put the prefix on the first line.
