#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import meow from 'meow';
import { mergeMessages, buildCSV, buildLocales } from './index';
import Crowdin from './services/crowdin';

dotenv.config();

const cli = meow(`
Usage
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
`, {
    flags: {
        config: {
            type: 'string',
            alias: 'c',
            default: 'l10n.config.json',
        },
    },
});

if (cli.input.length === 0) {
    console.error('Missing command');
    cli.showHelp(1);
}

const command = cli.input[0];

const configFilePath = cli.flags.config;
if (!configFilePath) {
    console.error('Config not specified');
    cli.showHelp();
}

// Parse configuration file
const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
const {
    languages, outputDir, localesOutputDir, extractedMessagesFilePattern,
} = config;

// Crowdin API key should be stored in an env variable which name is specified in the config 'apiKeyEnv' field
const projectId = config.project.identifier;
const apiKey = process.env[config.project.apiKeyEnv];
const crowdin = new Crowdin(projectId, apiKey);

switch (command) {
case 'merge-msgs':
    console.log(`Merging messages to ${path.join(outputDir, 'master.json')}`);
    mergeMessages(extractedMessagesFilePattern, path.join(outputDir, 'master.json'));
    break;

case 'build-csv':
    console.log(`Building csv file ${path.join(outputDir, 'master.csv')}`);
    buildCSV(path.join(outputDir, 'master.json'), path.join(outputDir, 'master.csv'), languages);
    break;

case 'upload':
    console.log(`Updating csv file '${path.join(outputDir, 'master.csv')}' to Crowdin project '${projectId}'`);
    crowdin.updateFile(path.join(outputDir, 'master.csv'))
        .catch((err) => {
            let crowdinErr = JSON.parse(err.error);

            // If file doesn't exist in Crowdin we need to use a different API endpoint to add a new file
            // https://support.crowdin.com/api/error-codes/
            if (crowdinErr.error.code === 8) {
                console.log("File doesn't exist in Crowdin, adding a new file.");
                const csvScheme = `identifier,source_phrase,context,${languages.join(',')}`;
                crowdin.addFile(path.join(outputDir, 'master.csv'), csvScheme)
                    .catch((addErr) => {
                        crowdinErr = JSON.parse(addErr.error);
                        console.log('Failed to upload new master.csv file to Crowdin');
                        console.log(crowdinErr);
                    });
            } else {
                console.log('Failed to upload new master.csv to Crowdin');
                console.log(crowdinErr);
            }
        });
    break;

case 'build-translations':
    console.log(`Building Crowdin translations for a project '${projectId}'`);
    crowdin.buildTranslations().then((res) => {
        console.log(res);
    }).catch((err) => {
        const crowdinErr = JSON.parse(err.error);
        console.log(crowdinErr);
    });
    break;

case 'export-translations':
    console.log(`Exporting translations for a project '${projectId}'`);
    crowdin.exportTranslations(localesOutputDir).then(() => {
        console.log(`Generating locales files in a directory ${localesOutputDir}`);
        buildLocales(path.join(localesOutputDir, 'master.csv'), localesOutputDir, languages, true);
    });
    break;

default:
    console.error('Unknown command');
    cli.showHelp();
    break;
}
