import fs from 'fs';

import { DEFAULT_LOCALE, LANGUAGES } from './languages';
import { SupportedLocaleCode } from './types';

// flatten object to single level deep like { a: { b: { c: 1 } } } => { 'a.b.c': 1 }
export const flatten = (obj: Record<string, any>, prefix = '') => {
    const result: Record<string, any> = {};
    Object.keys(obj).forEach(key => {
        const value = obj[key];
        const prefixedKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object') {
            Object.assign(result, flatten(value, prefixedKey));
        } else {
            result[prefixedKey] = value;
        }
    });

    return result;
};

export const unflatten = (obj: Record<string, any>) => {
    const result: Record<string, any> = {};

    for (const [flatKey, value] of Object.entries(obj)) {
        const keys = flatKey.split('.');
        let current = result;

        keys.forEach((key, index) => {
            if (index === keys.length - 1) {
                current[key] = value;
            } else {
                if (!(key in current)) {
                    current[key] = {};
                }
                current = current[key];
            }
        });
    }

    return result;
};

export const findClosestOfficiallySupportedLanguageLocale = (
    locale: string,
): SupportedLocaleCode => {
    const [language, _region] = locale.split('-');

    const matchingOfficialLanguageLocale = Object.entries(LANGUAGES).find(
        ([key, { type }]) => type === 'official' && key.startsWith(language),
    )?.[0] as SupportedLocaleCode | undefined;

    return matchingOfficialLanguageLocale ?? DEFAULT_LOCALE;
};

export const deleteNestedTranslationKey = (obj: Record<string, any>, path: string) => {
    const keys = path.split('.');
    let currentNode: Record<string, any> = obj;
    const parents: Array<{ node: Record<string, any>; key: string }> = [];

    for (let i = 0; i < keys.length - 1; i++) {
        const nextNode = currentNode[keys[i]];
        parents.push({ node: currentNode, key: keys[i] });
        currentNode = nextNode;
        if (!currentNode) return;
    }

    const lastKey = keys[keys.length - 1];
    if (!(lastKey in currentNode)) return;

    delete currentNode[lastKey];

    if (Object.keys(currentNode).length > 0) {
        return;
    }

    while (parents.length) {
        const { node, key } = parents.pop()!;
        delete node[key];

        if (Object.keys(node).length > 0) {
            break;
        }

        currentNode = node;
    }
};

export const writeMessagesObjectToFile = (messages: Record<string, any>, filePath: string) => {
    fs.writeFileSync(
        filePath,
        `
        // Few rules:
        // 1. Never use dynamic keys IDs for example: translate(\`module.graph.coin.\${symbol}\`) instead map it to static key: { btc: translate('module.graph.coin.btc') }
        // 2. Don't split string because of formatting or nested components use Rich Text Formatting instead https://formatjs.io/docs/react-intl/components#rich-text-formatting
        // 3. Always wrap keys per module/screen/feature for example: module.graph.legend
        
        export const messages = ${JSON.stringify(messages, null, 2)};`,
    );
};
