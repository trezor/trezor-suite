import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { normalizePath, walkDirectory } from '../../fileSystem';
import { stripComments } from '../../stripComments';
import type { Requirement } from '../Requirement';

const DOCS_DIR = 'docs';
const SUMMARY_FILE = 'SUMMARY.md';
const IGNORED_DOC_LINKS = new Set([SUMMARY_FILE, 'symlink/_README.md']);

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

        const walkDirectoryGenerator = walkDirectory(docsPath, {
            fileFilter: ({ entry }) =>
                (entry.isFile() || entry.isSymbolicLink()) && entry.name.endsWith('.md'),
        });
        for (const { path } of walkDirectoryGenerator) {
            const normalizedPath = normalizePath(relative(docsPath, path));

            if (IGNORED_DOC_LINKS.has(normalizedPath)) continue;

            const link = `./${normalizedPath}`;

            if (!summaryContent.includes(link)) {
                errors.push(`${DOCS_DIR}/${SUMMARY_FILE} does not link to ${link}`);
            }
        }

        return Promise.resolve(errors);
    },
};
