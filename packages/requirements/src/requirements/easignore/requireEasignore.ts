import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { normalizePath } from '../../fileSystem';
import { collectWorkspacePackages } from '../connectClosure';
import type { Requirement } from '../Requirement';
import {
    EASIGNORE_FILE,
    buildEasignoreContent,
    collectMobileWorkspaceClosure,
} from './easignoreContent';

const buildExpectedContent = (repoRoot: string) => {
    const packages = collectWorkspacePackages(repoRoot);
    const closureDirs = [...collectMobileWorkspaceClosure(packages)].map(name =>
        normalizePath(relative(repoRoot, packages.get(name)?.dir ?? repoRoot)),
    );

    return buildEasignoreContent(closureDirs);
};

const checkEasignore = ({ repoRoot, write }: { repoRoot: string; write: boolean }) => {
    const easignorePath = join(repoRoot, EASIGNORE_FILE);
    const expected = buildExpectedContent(repoRoot);
    const current = existsSync(easignorePath) ? readFileSync(easignorePath, 'utf-8') : '';

    if (current === expected) return [];

    if (write) {
        writeFileSync(easignorePath, expected);

        return [];
    }

    return [
        `${EASIGNORE_FILE} does not match the workspace closure of the mobile app. ` +
            'Run `yarn requirements:fix --only=easignore-mobile-closure` and commit the result.',
    ];
};

export const requireEasignoreMobileClosure: Requirement<'repo'> = {
    name: 'easignore-mobile-closure',
    scope: 'repo',
    verify: ({ repoRoot }) => Promise.resolve(checkEasignore({ repoRoot, write: false })),
    fix: ({ repoRoot }) => Promise.resolve(checkEasignore({ repoRoot, write: true })),
};
