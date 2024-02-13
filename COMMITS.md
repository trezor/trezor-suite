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

commit_msg=$(cat "$1")
if echo "$commit_msg" | grep -qE "^(Revert|fixup! )"; then
  # Skip validation in case of fixup and revert commits
  exit 0
fi

if ! grep -qE "^(build|ci|docs|feat|fix|perf|refactor|style|test|chore|revert)(\([a-z, -]+\))?: " "$1" ; then
  echo "Conventional Commits validation failed"
  exit 1
fi

```

If you want to bypass commit-msg hook check, you may always use

```bash
git commit -m "foobar" --no-verify
```
