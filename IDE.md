# IDE specific settings

## Visual Studio Code

Install the [Stylelint extension](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint),
then copy the code below to `.vscode/settings.json`.

```JSON
{
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    },
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "stylelint.validate": ["css", "postcss", "typescript", "typescriptreact"],
    "typescript.reportStyleChecksAsWarnings": false,
    "cSpell.words": ["blockbook", "bootloader", "cardano", "webworkers"],
    "editor.formatOnSave": true,
    "[html]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[javascript]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[typescript]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[typescriptreact]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[markdown]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[yaml]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[json]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[shellscript]": {
        "editor.defaultFormatter": "foxundermoon.shell-format"
    },
    "[dockerfile]": {
        "editor.defaultFormatter": "ms-azuretools.vscode-docker"
    }
}
```

## Zed

Install the [Stylelint extension](https://zed.dev/extensions?query=stylelint), then add this to
your Zed settings:

```JSON
{
    "lsp": {
        "stylelint-lsp": {
            "settings": {
                "stylelint": {
                    "packageManager": "yarn",
                    "validate": ["css", "postcss", "typescript", "typescriptreact"]
                }
            }
        }
    }
}
```

Stylelint uses the repository's `postcss-styled-syntax` configuration to validate CSS inside
styled-components template literals. It runs in its own language server, so the diagnostics work
with either the TypeScript language server or tsgo. It reports invalid CSS and provides code
actions, but CSS completion remains editor-specific.
