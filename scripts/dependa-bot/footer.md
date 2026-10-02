See [notion page](https://www.notion.so/satoshilabs/Dependency-Management-1b5bf845aa1f4ca7b9d57ea9ccd3fe63) for more details.

💡 _Hint:_ `ncu --deep -u -c 14 -t greatest --pre 0 -f DEP_NAME` to honor the [npmMinimalAgeGate](https://github.com/trezor/trezor-suite/blob/develop/.yarnrc.yml) when using [ncu](https://www.npmjs.com/package/npm-check-updates)

## QA instructions

🚧 not known yet, will be discovered – it depends on specific list of updated dependencies.

Please think about all the areas affected by each dependency, even on other platforms/other apps within monorepo.
