import { normalizePages } from 'nextra/normalize-pages';
import { Folder, MdxFile, PageMapItem } from 'nextra/types';

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const replaceMeta = (
    item: PageMapItem,
    mapping: (page: MdxFile | Folder<PageMapItem>) => [string, string],
) => {
    if (item?.kind === 'Folder' && item.children) {
        // Remove existing Meta if exists
        const metaIndex = item.children.findIndex(page => page.kind === 'Meta');
        if (metaIndex !== -1) {
            item.children.splice(metaIndex, 1);
        }
        // Add Meta with capitalized names
        item.children.push({
            kind: 'Meta',
            data: Object.fromEntries(
                item.children.flatMap(page => {
                    if (page.kind === 'Folder' || page.kind === 'MdxPage') {
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
    const methodsFolder = params.list.find(
        page => page.kind === 'Folder' && page.name === 'methods',
    );
    if (methodsFolder?.kind === 'Folder') {
        // Methods folders should have capitalized names
        replaceMeta(methodsFolder, page => [page.name, capitalize(page.name)]);
        // Methods sub items should have original names
        methodsFolder?.children.forEach(folder => {
            replaceMeta(folder, page => [page.name, page.name]);
        });
    }

    return normalizePages(params);
};
