/* eslint-disable @typescript-eslint/naming-convention */
import fs from 'fs';
import path from 'path';
import glob from 'glob';
import csvToJson from 'csvtojson';
import csvStringify from 'csv-stringify/lib/sync';
import { ensureDirSync } from 'fs-extra';
import recursive from 'recursive-readdir-sync';

import createRowArray, { MessageObject } from './utils/create-row-array';

interface MessageDescription {
    id: string;
    defaultMessage: string;
    description?: string;
    file: string;
}

/*
    Aggregates the default messages that were extracted from the app's
    React components via the React Intl Babel plugin. An error will be thrown if
    there are messages in different components that use the same `id`. The result
    is a flat collection of `translation_key: Object` pairs for the app's default locale.
    https://github.com/yahoo/react-intl/blob/master/examples/translations/scripts/translate.js

    Output format:
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
*/
export const mergeMessages = (
    filePattern: string,
    outputFilePath: string,
    allowDuplicates = false,
) => {
    // DEPRECATED
    const transformedMessages = glob
        .sync(filePattern)
        .map(filename => fs.readFileSync(filename, 'utf8'))
        .map(file => JSON.parse(file))
        .reduce((collection, descriptors) => {
            descriptors.forEach((d: MessageDescription) => {
                const { id, defaultMessage, description, file } = d;
                if ({}.hasOwnProperty.call(collection, id)) {
                    if (!allowDuplicates) {
                        console.log(collection[id].meta.occurrences);
                        throw new Error(`Duplicate message id: ${id}`);
                    }
                    if (defaultMessage === collection[id].source) {
                        collection[id].meta.occurrences.push(file);
                    } else {
                        throw new Error(`Duplicate message id: ${id} with different source string`);
                    }
                } else {
                    // eslint-disable-next-line no-param-reassign
                    collection[id] = {
                        source: defaultMessage,
                        meta: {
                            comment: description,
                            occurrences: [file],
                        },
                    };
                }
            });

            return collection;
        }, {});
    // Create a new directory that we want to write the aggregate messages to
    ensureDirSync(path.dirname(outputFilePath));
    fs.writeFileSync(outputFilePath, JSON.stringify(transformedMessages, null, 2));
};

/*
    Builds CSV file from JSON with merged messages.

    Format of an input file is same as format returned by npx formatjs extract --format crowdin:
    [
        {
            "message": "Source string that is to be translated to target language",
            "description": "Additional information for translators",
        },
        ...
    ]
}
*/
export const buildCSV = (inputFilePath: string, outputFilePath: string, languages: string[]) => {
    const messages: { [key: string]: MessageObject } = JSON.parse(
        fs.readFileSync(inputFilePath, 'utf-8'),
    ); // this contains our master data;
    const csvArrays = Object.entries(messages).map(([k, v]) =>
        createRowArray(k, v).concat(Array(languages.length).join('.').split('.')),
    );
    const cols = ['key', 'source', 'context'].concat(languages);
    fs.writeFileSync(
        outputFilePath,
        csvStringify(csvArrays, {
            header: true,
            columns: cols,
            quoted: true,
            quoted_empty: true,
        }),
    );
};

/*
    Build language json files from translated master.csv downloaded from Crowdin
 */
export const buildLocales = async (
    inputFilePath: string,
    outputDir: string,
    languages: string[],
    langToFileNameMap: { [key: string]: string } | undefined = undefined,
    deleteCSV = true,
) => {
    const jsonArray = await csvToJson().fromFile(inputFilePath);

    languages.forEach(language => {
        const langMessages = {};
        jsonArray.forEach(record => {
            // @ts-ignore
            langMessages[record.key] = record[language];
        });

        let localeFileName = language;
        if (langToFileNameMap && langToFileNameMap[language]) {
            localeFileName = langToFileNameMap[language];
        }
        const outputFilePath = path.join(outputDir, `${localeFileName}.json`);
        ensureDirSync(outputDir);
        // write json file for current locale
        fs.writeFileSync(outputFilePath, JSON.stringify(langMessages, null, '\t'));
    });

    if (deleteCSV) {
        // delete the CSV file from which locales were generated
        fs.unlinkSync(inputFilePath);
    }
};

export const findUnusedMessages = (messagesPath: string, srcs: string[]) => {
    const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
    // read all paths we are interested in. filter out those we are not.

    const paths: string[] = [];

    srcs.forEach(src => {
        const pathsInSrc = recursive(src).filter(path => {
            // - we dont need file with defined messages or tests
            const excluded = ['messages.ts', '.messages.ts', '__test__', '__tests__', '.test.ts'];
            if (excluded.some(e => path.includes(e))) return false;
            // all other are ok.
            return true;
        });
        paths.push(...pathsInSrc);
    });

    console.log(`checking  ${paths.length} paths`);

    // just a map we are going to use to count occurrences of messages throughout the codebase
    const tracker: { [key: string]: number } = {};

    paths.forEach(path => {
        const file = fs.readFileSync(path, 'utf-8');
        Object.keys(messages).forEach(m => {
            if (!tracker[m]) {
                tracker[m] = 0;
            }

            if (file.includes(m)) {
                tracker[m]++;
            }
        });
    });

    // lets check the results, filter unused (zero occurences)
    const unused = Object.entries(tracker).filter(t => t[1] === 0);

    if (unused.length === 0) {
        console.log('Good job, no useless keys in messages');
        process.exit(0);
    }

    console.log(unused);
    console.log(`Achtung achtung!, there is total ${unused.length} unused messages.`);
    process.exit(1);
};
