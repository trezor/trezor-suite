# trezor-translations-manager
[![npm version](https://badge.fury.io/js/trezor-translations-manager.svg)](https://badge.fury.io/js/trezor-translations-manager)

## Features

## Installation

```shell
yarn add --dev trezor-translations-manager
```

## Usage
### Extracting messages for translation
This package does not deal with the process of extracting messages for translation from your source code.

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

You can also build your own custom extraction process. Just make sure that the JSON file containing the messages matches following format:
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

### CLI
This package also serves as CLI tool. Configuration is stored in a JSON file. By default it will try to parse `l10n.config.json` in the root of your project. You can also specify the path to your configuration file via command line option `--config path`.

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

You can automatize running this tool by creating a new script entry in your project's `package.json`:
```json
{
    "scripts": {
        "translations-sync": "yarn ttm merge-msgs && yarn ttm build-csv && yarn ttm upload && yarn ttm build-translations && yarn ttm export-translations",
    }
}
```
Now you are able to run the whole flow  with `yarn run translations-sync`.


#### Configuration
##### Fields
- `extractedMessagesFilePattern`: [Glob](https://github.com/isaacs/node-glob) pattern used to look for React Intl messages that were extracted via [babel-plugin-react-intl](https://github.com/yahoo/babel-plugin-react-intl).
- `outputDir` - Directory which contains master JSON file with messages to translate.
- `localesOutputDir`: Output directory where lang-specific json files will be generated.
- `project.identifier`: Crowdin identifier of project 
- `project.apiKeyEnv`: Name of an environment variable which contains API key
- `languages`: [Crowdin language codes](https://support.crowdin.com/api/language-codes/). Codes are also used as filenames for generated lang-specific JSON files with translations. Be aware that they do not have to match codes returned by `navigator.language`.

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
### API
If the CLI tool does not suit your needs you can build your own script with these exported functions.

```
import { mergeMessages, buildCSV, buildLocales } from 'trezor-translations-manager';
import {
    addFile, updateFile, downloadTranslationsZip, buildTranslations, exportTranslations,
} from 'trezor-translations-manager/lib/services/crowdin';
```

#### mergeMessages(filePattern, outputFilePath)
Aggregates the default messages that were extracted from the app's React components via the React Intl Babel plugin. An error will be thrown if there are messages in different components that use the same `id`. The result is a flat collection of `translation_key: Object` pairs for the app's default locale.

- `filePattern`: Pattern used to look for React Intl messages that were extracted via [babel-plugin-react-intl](https://github.com/yahoo/babel-plugin-react-intl).
- `outputFilePath`: Path for outputed JSON file


#### buildCSV(inputFilePath, outputFilePath, languages)
Builds CSV file from JSON with merged messages.
Format of an input file is same as format of the file created by mergeMessages():
- `inputFilePath`: JSON file containing merged messages
- `outputFilePath`: Path for outputed CSV file
- `languages`: Array of [Crowdin language codes](https://support.crowdin.com/api/language-codes/) that are appended to CSV header

#### buildLocales(inputFilePath, outputDir, languages, deleteCSV = true)
Build language json files from a translated master.csv downloaded from Crowdin
- `inputFilePath`: Path to the CSV file downloaded from Crowdin.
- `outputDir`: Directory where locales should be generated.
- `languages`: Array of [Crowdin language codes](https://support.crowdin.com/api/language-codes/). Used for naming generated JSON locales files.
- `deleteCSV`: Whether should delete the csv file after. Default `true`.


#### addFile(filePath, scheme, projectId, apiKey)
Upload a new csv file to Crowdin service
- `filePath`: Path to a file
- `scheme`: Crowdin-specific CSV scheme (See [https://support.crowdin.com/api/add-file/](https://support.crowdin.com/api/add-file/))
- `projectId`: Identifier of a Crowdin project
- `apiKey`: API key for the Crowdin project

#### updateFile(filePath, projectId, apiKey)
Update an existing csv file in Crowdin service
- `filePath`: Path to a file
- `projectId`: Identifier of a Crowdin project
- `apiKey`: API key for the Crowdin project

#### buildTranslations(projectId, apikey)
Builds translations in Crowdin service. It does not actually download anything.
This method can be invoked only once per 30 minutes (otherwise the build process is skipped).
- `projectId`: Identifier of a Crowdin project
- `apiKey`: API key for the Crowdin project

#### downloadTranslationsZip(projectId, apiKey)
Downloads a ZIP file with translations.
- `projectId`: Identifier of a Crowdin project
- `apiKey`: API key for the Crowdin project

#### exportTranslations (exportDir, projectId, apiKey)
Downloads a ZIP file with translations and extracts files to exportDir
- `exportDir`: Directory where files from the archive should be extracted.
- `projectId`: Identifier of a Crowdin project
- `apiKey`: API key for the Crowdin project

## Development

#### Build 
To build a lib run `yarn build`

#### eslint
`yarn run lint`