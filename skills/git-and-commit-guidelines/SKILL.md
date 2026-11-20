---
name: git-and-commit-guidelines
description: Conventional Commits format, commit types, scopes, submodule bumps, and PR best practices for Trezor Suite. Use when committing code, bumping submodule, or creating pull requests.
---

# Git and Commit Guidelines

**IMPORTANT**: This project uses [Conventional Commits](https://www.conventionalcommits.org/). All commits MUST follow this format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

## Commit Types and Scopes

- **feat**: New feature (e.g., `feat(suite): add transaction history export`)
- **fix**: Bug fix (e.g., `fix(components): resolve modal z-index issue`)
- **docs**: Documentation changes (e.g., `docs: update setup instructions`)
- **refactor**: Code refactoring without behavior change
- **test**: Adding or updating tests
- **chore**: Build process, dependencies, tooling (e.g., `chore(deps): update eslint`)

Common scopes: `suite`, `suite-native`, `connect`, `components`, `analytics`

## Commit Best Practices

- **Plan internally, commit only code**: For complex tasks, use todo lists or internal planning, but only commit actual code changes with conventional commits
- **If you must commit intermediate work**, use proper conventional commits (e.g., `chore: work in progress on feature X`) and be prepared to squash before final push
- Write clear, concise commit messages describing the actual change
- One logical change per commit when possible
- Reference issue numbers in commit body when applicable (e.g., `Closes #1234`)
- Avoid committing plan documents or TODO files unless they are part of the project documentation

## Git Submodules

- Bump `submodules/trezor-common` (change the commit recorded for it) only when explicitly requested.
- If `git status` shows `submodules/trezor-common` as modified without such a request, do not stage it. Stage paths explicitly, because `git add -A`, `git add .` and `git commit -a` pick up the submodule change.
- Commit a requested bump separately, with no other changes. Adapt code or fixtures to the new version in a follow-up commit.
- Title the bump commit with the `trezor-common` scope: `chore(trezor-common): update trezor-common (<new short hash>)`

## Pull requests

- When creating a pull request to GitHub, follow this [PR description template](../../.github/pull_request_template.md)
- Notes for QA follow [QA notes](../qa-notes/SKILL.md): only the areas of the app to focus on
