import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { stripComments } from '../../stripComments';
import type { Requirement } from '../Requirement';

const DOCS_DIR = 'docs';
const SUMMARY_FILE = 'SUMMARY.md';
const IGNORED_DOC_LINKS = new Set([SUMMARY_FILE, 'symlink/_README.md']);

const collectMarkdownFiles = (directoryPath: string, docsPath: string): string[] => {
    const markdownFiles: string[] = [];

    for (const entry of readdirSync(directoryPath, { withFileTypes: true })) {
        const entryPath = join(directoryPath, entry.name);

        if (entry.isDirectory()) {
            markdownFiles.push(...collectMarkdownFiles(entryPath, docsPath));

            continue;
        }

        if ((!entry.isFile() && !entry.isSymbolicLink()) || !entry.name.endsWith('.md')) {
            continue;
        }

        // if running on Windows, fix paths to Unix style which is expected in the .md
        markdownFiles.push(relative(docsPath, entryPath).split(sep).join('/'));
    }

    return markdownFiles;
};

/**
 * Verifies that docs/SUMMARY.md (the entrypoint for mdBook), is exhaustive = every markdown file in docs/ is linked
 */
export const requireDocsSummary: Requirement<'repo'> = {
    name: 'docs-summary-exhaustive',
    scope: 'repo',
    verify: ({ repoRoot }) => {
        const errors: string[] = [];
        const docsPath = join(repoRoot, DOCS_DIR);
        const summaryPath = join(docsPath, SUMMARY_FILE);
        const summaryContent = stripComments(readFileSync(summaryPath, 'utf-8'));
        const docFiles = collectMarkdownFiles(docsPath, docsPath);

        for (const file of docFiles) {
            if (IGNORED_DOC_LINKS.has(file)) continue;

            const link = `./${file}`;

            if (!summaryContent.includes(link)) {
                errors.push(`${DOCS_DIR}/${SUMMARY_FILE} does not link to ${link}`);
            }
        }

        return Promise.resolve(errors);
    },
};
