#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import meow from 'meow';
import { mergeMessages, buildCSV, buildLocales, findUnusedMessages } from './index';
import Crowdin from './services/crowdin';

const cli = meow(
    `
Usage
    $ ttm <command>

    Options
        --config, -c  Config file
        --version, -v Show ttm version

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

        find-unused-messages --messages [string] --src [string | string[]]
            - performs fulltext search of keys provided in --messages option on all files under src

`,
    {
        flags: {
            config: {
                type: 'string',
                alias: 'c',
                default: 'l10n.config.json',
            },
            version: {
                type: 'boolean',
                alias: 'v',
            },
            messages: {
                type: 'string',
                alias: 'm',
            },
            src: {
                type: 'string',
                alias: 's',
            },
        },
    },
);

if (cli.input.length === 0) {
    console.log('Missing command');
    cli.showHelp(1);
}

const command = cli.input[0];

if (cli.flags.version) {
    console.log(cli.showVersion());
}

const configFilePath = cli.flags.config;
if (!configFilePath) {
    console.log('Config not specified');
    cli.showHelp();
}

// Parse configuration file
const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
const { languages, outputDir, localesOutputDir, extractedMessagesFilePattern, langToFileNameMap } =
    config;

// Crowdin API key should be stored in an env variable which name is specified in the config 'apiKeyEnv' field
const projectId = config.project.identifier;
const projectFilename = config.project.filename;
const apiKey = process.env[config.project.apiKeyEnv];
const login = process.env[config.project.loginEnv];

if (!apiKey) {
    console.log(`Could not read CrowdIn API key from env variable ${config.project.apiKeyEnv}`);
}

if (!login) {
    console.log(`Could not read CrowdIn login from env variable ${config.project.loginEnv}`);
}

const crowdin = new Crowdin(projectId, apiKey || '', login || '');

const mergedJSONFile = path.join(outputDir, `${projectFilename}.json`);
const mergedCSVFile = path.join(outputDir, `${projectFilename}.csv`);

switch (command) {
    case 'merge-msgs':
        console.log(`Merging messages to ${mergedJSONFile}`);
        mergeMessages(extractedMessagesFilePattern, mergedJSONFile);
        break;

    case 'build-csv':
        console.log(`Building csv file ${mergedCSVFile}`);
        buildCSV(mergedJSONFile, mergedCSVFile, languages);
        break;

    case 'upload':
        console.log(`Updating csv file '${mergedCSVFile}' to Crowdin project '${projectId}'`);
        crowdin.updateFile(mergedCSVFile).catch(err => {
            let crowdinErr = JSON.parse(err.error);

            // If file doesn't exist in Crowdin we need to use a different API endpoint to add a new file
            // https://support.crowdin.com/api/error-codes/
            if (crowdinErr.error.code === 8) {
                console.log("File doesn't exist in Crowdin, adding a new file.");
                const csvScheme = `identifier,source_phrase,context,${languages.join(',')}`;
                crowdin.addFile(mergedCSVFile, csvScheme).catch(addErr => {
                    crowdinErr = JSON.parse(addErr.error);
                    console.log(`Failed to upload new ${projectFilename}.csv file to Crowdin`);
                    console.log(crowdinErr);
                });
            } else {
                console.log(`Failed to upload new ${projectFilename}.csv to Crowdin`);
                console.log(crowdinErr);
            }
        });
        break;

    case 'build-translations':
        console.log(`Building Crowdin translations for a project '${projectId}'`);
        crowdin
            .buildTranslations()
            .then(res => {
                console.log(res);
            })
            .catch(err => {
                const crowdinErr = JSON.parse(err.error);
                console.log(crowdinErr);
            });
        break;

    case 'export-translations':
        console.log(`Exporting translations for a project '${projectId}'`);
        crowdin.exportTranslations(localesOutputDir).then(() => {
            console.log(`Generating locales files in a directory ${localesOutputDir}`);
            buildLocales(
                path.join(localesOutputDir, `${projectFilename}.csv`),
                localesOutputDir,
                languages,
                langToFileNameMap,
                true,
            );
        });
        break;

    case 'find-unused-messages':
        console.log('Looking for unused messagess...');
        console.log(cli.flags.src);
        findUnusedMessages(
            cli.flags.messages,
            Array.isArray(cli.flags.src) ? cli.flags.src : [cli.flags.src],
        );
        break;
    default:
        console.log('Unknown command');
        cli.showHelp();
        break;
}
