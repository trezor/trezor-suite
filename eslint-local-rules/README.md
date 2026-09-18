# ESLint local rules

This private workspace can be consumed directly from the Trezor Suite Git repository without
publishing it to a package registry. Pin the dependency to a commit so installs remain reproducible.

pnpm can install the workspace directory directly:

```json
{
    "devDependencies": {
        "@trezor/eslint-local-rules": "github:trezor/trezor-suite#<commit>&path:eslint-local-rules"
    }
}
```

Yarn can select the workspace by name:

```json
{
    "devDependencies": {
        "@trezor/eslint-local-rules": "https://github.com/trezor/trezor-suite.git#workspace=@trezor/eslint-local-rules&commit=<commit>"
    }
}
```

Yarn consumers must also allow this Git source in `.yarnrc.yml`:

```yaml
approvedGitRepositories:
    - https://github.com/trezor/trezor-suite.git
```

The package exports the complete local rule map. Register it as an ESLint plugin and enable only the
rules needed by the consumer:

```js
import trezorLocalRules from '@trezor/eslint-local-rules';

export default [
    {
        plugins: {
            '@trezor/local-rules': {
                rules: trezorLocalRules,
            },
        },
        rules: {
            '@trezor/local-rules/enforce-di-factory-contracts': 'error',
        },
    },
];
```
