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

## Pull requests

- When creating a pull request to GitHub, follow this [PR description template](../.github/pull_request_template.md)
