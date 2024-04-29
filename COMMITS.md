# Commits

Using [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) is enforced by a CI check.

### Examples

```
docs: correct spelling of CHANGELOG
feat: allow provided config object to extend other configs
feat(lang): added polish language
```

### Git hook

Use this git hook to auto-check your commit messages. Save the following snippet into `.git/hooks/commit-msg`. This way, the check will run locally and can avoid some unnecessary CI runs.

```bash
#!/bin/sh

LINT_COMMIT_MSG="$1" ./scripts/check-commit-messages.sh
```

If you want to bypass commit-msg hook check, you may always use

```bash
git commit -m "foobar" --no-verify
```
