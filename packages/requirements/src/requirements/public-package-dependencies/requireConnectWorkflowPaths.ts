import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { normalizePath } from '../../fileSystem';
import type { Requirement } from '../Requirement';
import {
    CONNECT_PUBLISH_ROOTS,
    collectProdWorkspaceClosure,
    collectWorkspacePackages,
} from '../connectClosure';

const WORKFLOWS_DIR = '.github/workflows';
const CONNECT_WORKFLOWS = ['test-connect.yml', 'test-connect-misc.yml'];

const PULL_REQUEST_PATHS_SECTION =
    /^( *)pull_request:\n(?:\1 +.*\n|[ \t]*\n)*?\1 +paths:\n(?<entries>(?:[ \t]*(?:#.*|- .*)?\n)+)/m;
const PATH_ENTRY = /^[ \t]*- ["']?(?<path>[^"'\s]+)["']?/gm;

const getPullRequestPaths = (workflow: string): ReadonlySet<string> | undefined => {
    const entries = workflow.match(PULL_REQUEST_PATHS_SECTION)?.groups?.entries;

    if (entries === undefined) return undefined;

    return new Set([...entries.matchAll(PATH_ENTRY)].flatMap(match => match.groups?.path ?? []));
};

/**
 * Verifies that the connect workflows run on a change to any package published with connect. The
 * `paths` lists have to stay literal YAML, so they are maintained by hand and may list more.
 */
export const requireConnectWorkflowPaths: Requirement<'repo'> = {
    name: 'connect-workflow-paths',
    scope: 'repo',
    verify: ({ repoRoot }) => {
        const packages = collectWorkspacePackages(repoRoot);
        const requiredPaths = [...collectProdWorkspaceClosure(CONNECT_PUBLISH_ROOTS, packages)]
            .flatMap(name => packages.get(name)?.dir ?? [])
            .map(dir => `${normalizePath(relative(repoRoot, dir))}/**`)
            .toSorted();

        const errors = CONNECT_WORKFLOWS.flatMap(workflowFile => {
            const workflowPath = `${WORKFLOWS_DIR}/${workflowFile}`;
            const listedPaths = getPullRequestPaths(
                readFileSync(join(repoRoot, workflowPath), 'utf-8'),
            );

            if (listedPaths === undefined) {
                return [`${workflowPath} has no pull_request.paths list.`];
            }

            return requiredPaths
                .filter(path => !listedPaths.has(path))
                .map(
                    path =>
                        `${workflowPath} must list "${path}" in pull_request.paths: the package is in the connect publish closure.`,
                );
        });

        return Promise.resolve(errors);
    },
};
