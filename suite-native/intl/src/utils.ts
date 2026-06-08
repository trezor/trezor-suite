import { DEFAULT_LOCALE, LANGUAGES } from './languages';
import { type SupportedLocaleCode } from './types';

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

// Detects translation keys whose path is a string (leaf) on one side but an object (ancestor) on
// the other. Crowdin re-interprets dot-joined keys as a nested tree, so such collisions break Crowdin sync.
export const findTranslationStructureCollisions = (
    messagesFlatKeys: string[],
    baselineFlatKeys: string[],
): Array<{ current: string; baseline: string }> => {
    const keySet = new Set([...messagesFlatKeys, ...baselineFlatKeys]);
    const collisions: Array<{ current: string; baseline: string }> = [];

    for (const key of keySet) {
        let dotIndex = key.lastIndexOf('.');
        while (dotIndex !== -1) {
            const ancestor = key.slice(0, dotIndex);
            if (keySet.has(ancestor)) {
                collisions.push({ current: ancestor, baseline: key });
            }
            dotIndex = ancestor.lastIndexOf('.');
        }
    }

    return collisions;
};

export const findClosestOfficiallySupportedLanguageLocale = (
    locale: string,
): SupportedLocaleCode => {
    const [language] = locale.split('-');

    const matchingOfficialLanguageLocale = language
        ? (Object.entries(LANGUAGES).find(
              ([key, { type }]) => type === 'official' && key.startsWith(language),
          )?.[0] as SupportedLocaleCode | undefined)
        : undefined;

    return matchingOfficialLanguageLocale ?? DEFAULT_LOCALE;
};

export const deleteNestedTranslationKey = (obj: Record<string, any>, path: string) => {
    const keys = path.split('.');
    let currentNode: Record<string, any> = obj;
    const parents: Array<{ node: Record<string, any>; key: string }> = [];

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (key === undefined) return;
        const nextNode = currentNode[key];
        parents.push({ node: currentNode, key });
        currentNode = nextNode;
        if (!currentNode) return;
    }

    const lastKey = keys[keys.length - 1];
    if (lastKey === undefined || !(lastKey in currentNode)) return;

    delete currentNode[lastKey];

    if (Object.keys(currentNode).length > 0) {
        return;
    }

    let parent = parents.pop();
    while (parent) {
        const { node, key } = parent;
        delete node[key];

        if (Object.keys(node).length > 0) {
            break;
        }

        currentNode = node;
        parent = parents.pop();
    }
};
