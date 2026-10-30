---
name: pr-review
description: Review pull requests using the GitHub CLI with agent and model attribution on every comment; never approve or merge.
---

Use the GitHub CLI (`gh`) for all GitHub interactions during PR reviews.

NEVER approve any pull request or merge request on any platform. NEVER merge any pull request or merge request on any platform, including by pushing a merged result to its target branch. A human performs both actions.

Only leave comments, even when the review finds no issues. Do not submit an approval or a change-request verdict; express the outcome and any blocking findings in comments.

Before reporting that code loses type safety (for example, that a built-in returns `any` or that an annotation is unchecked), confirm the inferred type with the editor, a `tsc` probe, or the relevant lint rule. Contextual typing often makes the code safer than the declared signature suggests. Do not report it as a finding without that confirmation. When the type really is lost and a typed helper exists, suggest the helper (see the [TypeScript skill](../typescript/SKILL.md#prefer-typed-helpers-to-casting-native-apis)).

Start every review comment, including summaries and inline comments, with the agent attribution prefix:

```text
🤖 Agent <Model> <Version> (reasoning: <Reasoning>):
```

Use the actual model, version, and reasoning level. Example: `🤖 Agent Fable 5.1 (reasoning: High):`
