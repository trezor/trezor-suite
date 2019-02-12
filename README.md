# trezor-translations-manager

## Features

## Installation

```shell
yarn add slowbackspace/trezor-translations-manager
```

## Usage
### Extracting messages for translation
This package does not deal with the process of extracting messages for translations from your source code.

For React apps it is recommended to use [babel-plugin-react-intl](https://github.com/yahoo/babel-plugin-react-intl). Then with `ttm merge-msgs` you can merge extracted messages to one JSON file.

Example configuration in the `babel.config.js`
```javascript
[
    'react-intl',
    {
        messagesDir: './translations/extractedMessages/',
        extractSourceLocation: true,
    },
],

```

You can also build your own custom process. Just make sure that the JSON file containing the messages matches following format:
```json
[
    {
    "source": "Source string that is to be translated to target language",
    "meta": {
        "comment": "Additional information for translators",
        "occurrences": [
            "Path to file that containts the message"
        ]
    },
    ...
]
``` 

#### CLI
CLI requires a configuration file. By default it will try to parse 'l10n.config.json' inside the root of your project. You can also specify the path to your configuration file via command line option `--config path`.
```shell
    $ ttm <command>
    
    Options
        --config, -c  Config file

    Commands
        merge-msgs
            - merges messages exported by babel-plugin-react-intl to single JSON file

        build-csv
            - converts JSON file to CSV

        upload
            - uploads CSV file to Crowdin

        build-translations
            - builds translations in Crowdin

        export-translations
            - downloads translations and generates locales
```

### Configuration
#### Fields
- `extractedMessagesFilePattern`: [Glob](https://github.com/isaacs/node-glob) pattern used to look for React Intl messages that were extracted via [babel-plugin-react-intl](https://github.com/yahoo/babel-plugin-react-intl).
- `outputDir` - Directory which contains master JSON file with messages to translate.
- `localesOutputDir`: Output directory where lang-specific json files will be generated.
- `project.identifier`: Crowdin identifier of project 
- `project.apiKeyEnv`: Name of an environment variable which contains API key
- `csvScheme`: Scheme of CSV file that will be generated from JSON file. Used when uploading a new file to Crowdin.
- `languages`: [Crowdin language codes](https://support.crowdin.com/api/language-codes/). Codes are also used as filenames for generated lang-specific JSON files with translations.

`l10n.config.json` file example
```json
{
    "extractedMessagesFilePattern": "translations/extractedMessages/**/*.json",
    "localesOutputDir": "translations/locales/",
    "outputDir": "translations/",
    "project": {
        "identifier": "trezor-wallet-test",
        "apiKeyEnv": "CROWDIN_API_KEY"
    },
    "languages": [
        "af",
        "ar",
        "bn",
        "zh-CN",
        "zh-TW",
        "cs",
        "nl",
        "en",
        "et",
        "fr",
        "de",
        "el",
        "he",
        "hi",
        "hu",
        "id",
        "it",
        "ja",
        "ko",
        "no",
        "fa",
        "pl",
        "pt-PT",
        "ru",
        "es-ES",
        "sv-SE",
        "tr",
        "uk",
        "vi"
    ]
}

```
