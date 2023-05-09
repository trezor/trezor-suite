import { join } from 'path';
import * as fs from 'fs-extra';

import { resolveStaticPath } from '@suite-common/suite-utils';
import { GuideNode } from '@suite-common/suite-types';

/** Removes the front-matter from beginning of a string. */
const clean = (md: string): string => md.replace(/^---\n.*?\n---\n/s, '');

/**
 * Transforms GitBook images path to Suite images path.
 *
 * ![](../../.gitbook/assets/example.png) to ![](static/guide/assets/example.png)
 */
const transformImagesPath = (md: string): string =>
    md.replace(/(?<=\]\()(.*?)(?=\/assets)/g, resolveStaticPath('/guide'));

/**
 * Given index of GitBook content transforms the content
 * in source and dumps it into destination.
 *
 * Removes GitBook front-matter from MD files if present.
 *
 * @param node Index of the content to be transformed.
 * @param source Path to directory with the markdown files.
 * @param destination Path to directory where the cleaned markdown will be dumped.
 */
export const transform = (node: GuideNode, source: string, destination: string) => {
    if (node.type === 'category') {
        node.locales.forEach(locale => {
            fs.mkdirpSync(join(destination, locale, node.id));
        });
        node.children.forEach(child => transform(child, source, destination));
    } else {
        node.locales.forEach(locale => {
            const markdown = fs.readFileSync(join(source, locale, node.id)).toString();
            const transformedMarkdown = transformImagesPath(clean(markdown));

            fs.writeFileSync(join(destination, locale, node.id), transformedMarkdown);
        });
    }
};
