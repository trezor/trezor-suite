import type { Folder, MdxFile, PageMapItem } from 'nextra';
import { normalizePages } from 'nextra/normalize-pages';

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const isFolder = (item: PageMapItem): item is Folder<PageMapItem> =>
    'children' in item && !('data' in item);

const isMeta = (item: PageMapItem): item is { data: Record<string, any> } => 'data' in item;

const isMdxOrFolder = (item: PageMapItem): item is MdxFile | Folder<PageMapItem> =>
    !('data' in item);

const replaceMeta = (
    item: PageMapItem,
    mapping: (page: MdxFile | Folder<PageMapItem>) => [string, string],
) => {
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
                    if (isMdxOrFolder(page)) {
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
        page => isFolder(page) && (page as Folder<PageMapItem>).name === 'methods',
    ) as Folder<PageMapItem> | undefined;

    if (methodsFolder) {
        // Methods folders should have capitalized names
        replaceMeta(methodsFolder, page => [page.name, capitalize(page.name)]);
        // Methods sub items should have original names
        methodsFolder.children.forEach(folder => {
            replaceMeta(folder, page => [page.name, page.name]);
        });
    }

    return normalizePages(params);
};
