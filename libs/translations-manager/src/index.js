import fs from 'fs';
import path from 'path';
import glob from 'glob';
import csvToJson from 'csvtojson';
import csvStringify from 'csv-stringify/lib/sync';
import { ensureDirSync } from 'fs-extra';
import createRowArray from './utils/create-row-array';

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
export const mergeMessages = (filePattern, outputFilePath, allowDuplicates = false) => {
    const transformedMessages = glob.sync(filePattern)
        .map(filename => fs.readFileSync(filename, 'utf8'))
        .map(file => JSON.parse(file))
        .reduce((collection, descriptors) => {
            descriptors.forEach((d) => {
                const {
                    id, defaultMessage, description, file,
                } = d;
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
                            occurrences: [
                                file,
                            ],
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

    Format of an input file is same as format of the file created by mergeMessages():
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
}
*/
export const buildCSV = (inputFilePath, outputFilePath, languages) => {
    const messages = JSON.parse(fs.readFileSync(inputFilePath, 'utf-8')); // this contains our master data;
    const csvArrays = Object.entries(messages).map(([k, v]) => createRowArray(k, v).concat(Array(languages.length).join('.').split('.')));
    const cols = ['key', 'source', 'context'].concat(languages);
    fs.writeFileSync(outputFilePath, csvStringify(csvArrays, {
        header: true, columns: cols, quoted: true, quoted_empty: true,
    }));
};

/*
    Build language json files from translated master.csv downloaded from Crowdin
 */
export const buildLocales = async (inputFilePath, outputDir, languages, langToFileNameMap = null, deleteCSV = true) => {
    const jsonArray = await csvToJson().fromFile(inputFilePath);

    languages.forEach((language) => {
        const langMessages = {};
        jsonArray.forEach((record) => {
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
