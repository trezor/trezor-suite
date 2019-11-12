# trezor-translations-manager
[![npm version](https://badge.fury.io/js/trezor-translations-manager.svg)](https://badge.fury.io/js/trezor-translations-manager)

CLI tool for synchronizing localization resources with Crowdin service.

## Features

## Installation

```shell
yarn add --dev trezor-translations-manager
```

## Usage
### Extracting messages for translation
This package does not deal with the process of extracting messages for translation from your source code.

For React apps it is recommended to use [babel-plugin-react-intl](https://github.com/yahoo/babel-plugin-react-intl). Then with `ttm merge-msgs` you can merge extracted messages to a single JSON file.

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
```
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
        --version, -v  Show ttm version

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
- `outputDir` - Directory which contains JSON file with messages to translate.
- `localesOutputDir`: Output directory where lang-specific json files will be generated.
- `project.identifier`: Crowdin identifier of project 
- `project.filename`: Name of the file in `outputDir` with extracted messages (without an extension) 
- `project.apiKeyEnv`: Name of an environment variable which contains API key
- `languages`: [Crowdin language codes](https://support.crowdin.com/api/language-codes/). Codes are also used as filenames for generated lang-specific JSON files with translations. Be aware that they do not have to match codes returned by `navigator.language`.
- `langToFileNameMap`: Object of language:filename pairs. Allows to overrides default filenames of generated locales JSON files

`l10n.config.json` example
```json
{
    "extractedMessagesFilePattern": "translations/extractedMessages/**/*.json",
    "localesOutputDir": "translations/locales/",
    "outputDir": "translations/",
    "project": {
        "identifier": "trezor-wallet-test",
        "filename": "master",
        "apiKeyEnv": "CROWDIN_API_KEY"
    },
    "languages": ["af", "ar", "bn", "zh-CN", "zh-TW", "cs", "nl", "en", "et", "fr", "de", "el", "he", "hi", "hu", "id", "it", "ja", "ko", "no", "fa", "pl", "pt-PT", "ru", "es-ES", "sv-SE", "tr", "uk", "vi"],
    "langToFileNameMap": { "en": "en", "bn": "bn", "cs": "cs", "de": "de", "el": "el", "es-ES": "es", "fr": "fr", "id": "id", "it": "it", "ja": "ja", "nl": "nl", "pl": "pl", "pt-PT": "pt", "ru": "ru", "uk": "uk", "zh-CN": "zh", "zh-TW": "zh_TW"}
}

```
### API
If the CLI tool does not suit your needs you can build your own script with these exported functions.

```javascript
import { mergeMessages, buildCSV, buildLocales } from 'trezor-translations-manager';
import Crowdin from 'trezor-translations-manager/lib/services/crowdin';

// projectId - Identifier of a Crowdin project
// apiKey - API key for the Crowdin project
const crowdin = new Crowdin(projectId, apiKey);
// available methods are addFile, updateFile, downloadTranslationsZip, buildTranslations, exportTranslations,
```

#### mergeMessages(filePattern, outputFilePath, allowDuplicates = false)
Aggregates the default messages that were extracted from the app's React components via the [React Intl Babel plugin](https://github.com/yahoo/babel-plugin-react-intl). The result is a flat collection of `translation_key: Object` pairs for the app's default locale.

- `filePattern`: Pattern used to look for React Intl messages
- `outputFilePath`: Path for outputed JSON file
- `allowDuplicates`: If `false` an error will be thrown if there are messages in different components that use the same `id`


#### buildCSV(inputFilePath, outputFilePath, languages)
Builds CSV file from JSON with merged messages.
Format of an input file is same as format of the file created by mergeMessages():
- `inputFilePath`: JSON file containing merged messages
- `outputFilePath`: Path for outputed CSV file
- `languages`: Array of [Crowdin language codes](https://support.crowdin.com/api/language-codes/) that are appended to CSV header

#### buildLocales(inputFilePath, outputDir, languages, langToFileNameMap = null, deleteCSV = true)
Build language json files from a translated CSV file (downloaded from Crowdin)
- `inputFilePath`: Path to the CSV file downloaded from Crowdin.
- `outputDir`: Directory where locales should be generated.
- `languages`: Array of [Crowdin language codes](https://support.crowdin.com/api/language-codes/). Used for naming generated JSON locales files.
- `langToFileNameMap`: Object of language:filename pairs. Allows to overrides default filenames of generated locales JSON files
- `deleteCSV`: Whether should delete the csv file after. Default `true`.


#### crowdin.createBranch(branch)
Creates a new branch in Crowdin service
- `branch`: Crowdin branch name

#### crowdin.addFile(filePath, scheme, branch = null)
Upload a new csv file to Crowdin service
- `filePath`: Path to a file
- `scheme`: Crowdin-specific CSV scheme (See [https://support.crowdin.com/api/add-file/](https://support.crowdin.com/api/add-file/))
- `branch`: Crowdin branch name

#### crowdin.updateFile(filePath, branch = null)
Update an existing csv file in Crowdin service
- `filePath`: Path to a file
- `branch`: Crowdin branch name

#### crowdin.buildTranslations(branch = null)
Builds translations in Crowdin service. It does not actually download anything.
This method can be invoked only once per 30 minutes (otherwise the build process is skipped).
- `branch`: Crowdin branch name

#### crowdin.downloadTranslationsZip(branch = null)
Downloads a ZIP file with translations.
- `branch`: Crowdin branch name

#### crowdin.exportTranslations (exportDir, branch = null)
Downloads a ZIP file with translations and extracts files to exportDir
- `exportDir`: Directory where files from the archive should be extracted.
- `branch`: Crowdin branch name

## Development

#### Build 
To build a lib run `yarn build`

#### eslint
`yarn run lint`
