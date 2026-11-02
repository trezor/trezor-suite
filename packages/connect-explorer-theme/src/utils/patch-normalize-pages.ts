import type { Folder, MdxFile, MetaJsonFile, PageMapItem } from 'nextra';
import { normalizePages } from 'nextra/normalize-pages';

import { capitalizeFirstLetter } from '@trezor/utils';

const FOLDER_TITLE_OVERRIDES: Record<string, string> = {
    common: 'Common Methods',
};

const isFolder = (item: PageMapItem): item is Folder => 'children' in item;

const isMeta = (item: PageMapItem): item is MetaJsonFile => 'data' in item;

const replaceMeta = (item: PageMapItem, mapping: (page: MdxFile | Folder) => [string, string]) => {
    if (isFolder(item) && item.children) {
        // Remove existing Meta if exists
        const metaIndex = item.children.findIndex(page => isMeta(page));
        if (metaIndex !== -1) {
            item.children.splice(metaIndex, 1);
        }
        // Add Meta with capitalized names
        item.children.push({
            data: Object.fromEntries(
                item.children.flatMap(page => {
                    if (!isMeta(page)) {
                        return [mapping(page)];
                    } else {
                        return [];
                    }
                }),
            ),
        });
    }
};

export const patchedNormalizePages = (
    params: Parameters<typeof normalizePages>[0],
): ReturnType<typeof normalizePages> => {
    // Patch the Methods to set correct title cases
    const methodsFolder = params.list.filter(isFolder).find(page => page.name === 'methods');

    if (methodsFolder) {
        // Methods folders should have capitalized names
        replaceMeta(methodsFolder, page => [
            page.name,
            FOLDER_TITLE_OVERRIDES[page.name] ?? capitalizeFirstLetter(page.name),
        ]);
        // Methods sub items should have original names
        methodsFolder.children.forEach(folder => {
            replaceMeta(folder, page => [page.name, page.name]);
        });
    }

    return normalizePages(params);
};
