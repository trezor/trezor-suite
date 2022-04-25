# Message System

Message system was implemented to allow sending emergency messages to Trezor Suite app to a user with specific stack.

[Example messages](https://www.notion.so/1d622e7079c14f64a03fa17f50bce14f?v=b8649de184c3437abb983990c5513e5f)

[Issue on Github](https://github.com/trezor/trezor-suite/issues/2752)

## Types of in-app messages

There are four ways of displaying message to a user.

-   banner
    -   looks like a cookie bar above the page
-   modal
    -   _TODO: missing implementation_
-   context
    -   messages on specific places in app - high level (e.g. settings page)
    -   _TODO: missing implementation_
-   super-context
    -   messages on specific places in the app - low level (e.g. category in settings page)
    -   _TODO: missing implementation_

## Implementation

### Config

The system of messages is based on a configuration file in which messages with specific conditions ​are described. If specific conditions are satisfied, the message is shown to a user.

Current configuration file is located in `packages/suite-data/src/message-system/config` [folder](https://github.com/trezor/trezor-suite/tree/145a43d21ee94461d3f013c1dc23241dd27b0224/packages/suite-data/src/message-system/config). Its name is `config.vX.json`. The `X` express current version messaging system.

The config is fetched at launch of the application and then every 6 hours. It remembers the previously fetched config to inform the user even if he is offline. For this reason, the latest available config during build time is bundled with the application.

If fetching of a new config fails, the fetching process is repeated every 1 hour.

### Schema

The configuration structure is specified in JSON file using JSON schema. The file can be found in `packages/suite-data/src/message-system/schema` [folder](https://github.com/trezor/trezor-suite/tree/145a43d21ee94461d3f013c1dc23241dd27b0224/packages/suite-data/src/message-system/schema). Its name is `config.schema.vX.json`.

We use JSON schema for 2 reasons:

-   generating TypeScript types
-   validating configuration file

### Types

Types are generated from JSON-schema during the `build:libs` process or can be generated manually by `yarn workspace @trezor/suite-data msg-system-types`. A `messageSystem.ts` file is created in `packages/suite/src/types/suite` [folder](https://github.com/trezor/trezor-suite/tree/145a43d21ee94461d3f013c1dc23241dd27b0224/packages/suite/src/types/suite).

-   This file should never be changed manually.
-   This file is committed into the repository.

### Signing

To ensure the authenticity of a configuration file, JSON Web Signatures are used. The configuration file is signed by a private key using elliptic curves (ES256) and the data specified in the config are used. The authenticity is verified on client side using corresponding public key.

### CI job

#### Validation

-   Validation of configuration file is performed in CI job in `validation` phase. It is used to detect possible structure and semantic errors.
-   It can be run locally by `yarn workspace @trezor/suite-data msg-system-validate-config` script in suite-data.

#### Signing

-   Signing of the configuration file is performed in CI job in `prebuild` phase.
-   The result is saved into `suite-data/files/message-system` to be bundled with application and automatically uploaded to `https://data.trezor.io/config/$environment/config.vX.json`. For example, on localhost, the config is available at `http://localhost:8000/static/message-system/config.vX.jws`.
-   It can be run manually by `yarn workspace @trezor/suite-data msg-system-sign-config` script in suite-data. The resulting JWS is stored in `packages/suite-data/files/message-system/` [folder](https://github.com/trezor/trezor-suite/tree/145a43d21ee94461d3f013c1dc23241dd27b0224/packages/suite-data/files) in `config.vX.jws` file.
-   Development public and private keys are baked into project structure. For production environment, these keys are replaced by CI job by production keys. This production CI job is activated on `codesign` branches.
-   Development private key can be found in `suite-data/src/message-system/scripts/sign-config.ts` [file](https://github.com/trezor/trezor-suite/blob/145a43d21ee94461d3f013c1dc23241dd27b0224/packages/suite-data/src/message-system/scripts/sign-config.ts), the public key can be found in `suite-build` in `codesign.ts` ([file](https://github.com/trezor/trezor-suite/blob/0042e719d7d9fa2dff2ed743b0866e64f4ae0216/packages/suite-build/utils/codesign.ts).

### Versioning of implementation

If changes made to the message system are incompatible with the previous version, the version number should be bumped in `messageSystemConstants.ts` [file](https://github.com/trezor/trezor-suite/blob/145a43d21ee94461d3f013c1dc23241dd27b0224/packages/suite/src/actions/suite/constants/messageSystemConstants.ts) in `suite` package as well as in suite-data package in `message-system/constants` [file](https://github.com/trezor/trezor-suite/blob/145a43d21ee94461d3f013c1dc23241dd27b0224/packages/suite-data/src/message-system/constants/index.ts). Also in `ci/packages/suite-data.yml` [file](https://github.com/trezor/trezor-suite/blob/145a43d21ee94461d3f013c1dc23241dd27b0224/ci/packages/suite-data.yml).

### Config Structure

Structure of config, types and optionality of specific keys can be found in the schema or in generated types. Example config is commented below.

```javascript
{
    // Version of message system implementation. Bump if new version is not backward compatible.
    "version": 1,
    // Datetime in ISO8601 when was config created.
    "timestamp": "2021-03-03T03:48:16+00:00",
    // Version of config. New config is accepted only if sequence number is higher.
    "sequence": 1,
    "actions": [
        {
            /*
            - User's stack has to match one of the condition objects to show this message.
            - The bitwise operation is OR.
            */
            "conditions": [
                /*
                - All keys are optional (duration, os, environment, browser, settings, transport,
                  devices, architecture (To be implemented))
                - If a value is specified then all its subkeys have to be specified
                - The bitwise operation is AND.
                */
                {
                    /*
                    - Datetime in ISO8601 from / to which date this message is valid.
                    - If duration category is used, then both times have to be set.
                    */
                    "duration": {
                        "from": "2021-03-01T12:10:00.000Z",
                        "to": "2022-01-31T12:10:00.000Z"
                    },
                    /*
                    For os, environment, browser and transport.
                    - All values (except for revision in environment) are version definitions
                    - Semver npm library is used for working with versions https://www.npmjs.com/package/semver.
                    - "*" = all versions; "!" = not for this type of browser/os/...
                    - Options: gte, lt, ranges, tildes, carets,... are supported, see semver lib for more info.
                    */
                    "os": {
                        "macos": [
                            "10.14",
                            "10.18",
                            "11"
                        ],
                        "linux": "*",
                        "windows": "!",
                        "android": "*",
                        "ios": "13",
                        "chromeos": "*"
                    },
                    // revision is optional
                    "environment": {
                        "desktop": "<21.5",
                        "mobile": "!",
                        "web": "<22",
                        "revision": "7281ac61483e38d974625c2505bfe5efd519aacb"
                    },
                    "browser": {
                        "firefox": [
                            "82",
                            "83"
                        ],
                        "chrome": "*",
                        "chromium": "!"
                    },
                    "transport": {
                        "bridge": [
                            "2.0.30",
                            "2.0.27"
                        ],
                        "webusbplugin": "*"
                    },
                    /*
                    - If key is not available (undefined), then it can be whatever.
                    - Currently supported keys are "tor" and coin symbols from "enabledNetworks".
                    - The bitwise operation is OR.
                    */
                    "settings": [
                        {
                            "tor": true,
                            "btc": true
                        },
                        {
                            "tor": false,
                            "ltc": true
                        }
                    ],
                    // Empty device array is targeting users without a connected device.
                    "devices": [
                        {
                            // Possible values: "1" or "T"
                            "model": "1",
                            "firmware": "1.9.4",
                            // Possible values: "*", "bitcoin-only", and "regular"
                            "variant": "bitcoin-only",
                            "vendor": "trezor.io"
                        }
                    ]
                }
            ],
            "message": {
                // Used for remembering dismissed messages.
                "id": "0f3ec64d-c3e4-4787-8106-162f3ac14c34",
                /*
                - Existing banners have defined priorities.
                - The range is 0 to 100.
                */
                "priority": 100,
                // When user closes the message, it will never show again.
                "dismissible": true,
                /*
                Variants:
                - info (blue)
                - warning (orange)
                - critical (red)
                */
                "variant": "warning",
                // Options: banner, modal, context, super-context
                "category": "banner",
                /*
                - Message in language of Suite app is shown to a user.
                - Currently 'en', 'es', 'cs', 'ru', 'ja' are supported.
                - 'en-GB' is used for backward compatibility and should match value of 'en'.
                */
                "content": {
                    "en-GB": "New Trezor firmware is available!",
                    "en": "New Trezor firmware is available!",
                    "de": "Neue Trezor Firmware ist verfügbar!"
                },
                // Call to action. Used only for banner and context.
                "cta": {
                    /*
                    Options: "internal-link" or "external-link"
                    - internal-link is route name, see routes.ts file
                        - anchor property can be used, see anchors.ts file
                    - external-link is url address
                    */
                    "action": "internal-link",
                    // Route name or url address according to action.
                    "link": "settings-device",
                    "anchor": "@device-settings/firmware-version",
                    /*
                    - Label of call to action button shown to a user.
                    */
                    "label": {
                        "en-GB": "Update now",
                        "en": "Update now",
                        "de": "Jetzt aktualisieren"
                    }
                },
                // Used only for modals. (To be implemented)
                "modal": {
                    "title": {
                        "en-GB": "Update now",
                        "en": "Update now",
                        "de": "Jetzt aktualisieren"
                    },
                    "image": "https://example.com/example.png"
                },
                // Used only for context and super-context. (To be implemented)
                "context": {
                    "domain": [
                        "coins.*.receive",
                        "coins.btc"
                  ]
                }
            }
        }
    ]
}
```

#### How to update

When updating message system config, sequence number must always be higher than the previous one. Once released config cannot be rolled back to the previous one with lower sequence number. A new one with higher sequence number has to be created.

Updated config is automatically uploaded by CI job to the correspondent S3 bucket based on the current branch.

#### Priorities of messages

Based on the priority of the message, the message is displayed to the user. 0 is the lowest priority, 100 is the highest priority.
Current priorities of existing banners can be found [here](https://github.com/trezor/trezor-suite/blob/145a43d21ee94461d3f013c1dc23241dd27b0224/packages/suite/src/components/suite/Banners/index.tsx).

#### Targeting Linux version

Unfortunately, it is not possible to target specific distributions and versions of Linux. It is possible to only target all Linux users using `*` or exclude all Linux users using `!`.

### Application steps

1. Config is fetched on load of application and is stored in Redux state. To be persisted between sessions, is is mirrored into IndexDB.
2. Conditions of config are evaluated on specific Redux actions. See `messageSystemMiddleware.ts` [file](https://github.com/trezor/trezor-suite/blob/145a43d21ee94461d3f013c1dc23241dd27b0224/packages/suite/src/middlewares/suite/messageSystemMiddleware.ts).
3. If conditions of message satisfies user's stack, the message is accordingly propagated. If it is dismissible, its id is saved to Redux state (IndexDB) on close, to avoid displaying next time.

### Followup

Ideas and non-critical bugs can be added to the followup [issue](https://github.com/trezor/trezor-suite/issues/3693).
