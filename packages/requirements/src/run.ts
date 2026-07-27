#!/usr/bin/env tsx

import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

import { createExecCliCommand } from './execCliCommand';
import { createGetAffectedWorkspaces } from './getAffectedWorkspaces';
import { createReport } from './report';
import type { RequirementMode } from './requirements/Requirement';
import { requirements } from './requirements/allRequirements';
import { runRequirements } from './runRequirements';

const getModeFromPositionals = (positionals: ReadonlyArray<string>): RequirementMode => {
    const mode = positionals[0];

    if (mode === 'verify' || mode === 'fix') {
        return mode;
    }

    throw new Error(`Invalid mode "${mode ?? ''}". Use "verify" or "fix".`);
};

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const requirementsWorkspaceName = pkg.name;
if (typeof requirementsWorkspaceName !== 'string') {
    throw new Error('Failed to get name of this workspace (requirements) from package.json.');
}

/**
 * Runs requirements in selected mode (`verify` or `fix`) for Nx-affected workspaces.
 *
 * CLI options:
 * - `--filter <value>` narrows affected workspaces by name substring.
 *   Example: `--filter=@trezor/connect` runs workspace-scoped requirements only for
 *   matching affected workspaces.
 *
 * - `--only <requirement-name>` runs only a single requirement by exact requirement
 *   name (for example `agents-skills-linked` or `package-json`).
 */
const main = async () => {
    // Composition Root
    const execCliCommand = createExecCliCommand({ console });
    const getAffectedWorkspaces = createGetAffectedWorkspaces({
        execCliCommand,
        requirementsWorkspaceName,
    });
    const report = createReport({ console });

    // Run
    const { values, positionals } = parseArgs({
        args: process.argv.slice(2),
        options: {
            filter: { type: 'string' },
            only: { type: 'string' },
        },
        strict: false,
        allowPositionals: true,
    });

    const mode = getModeFromPositionals(positionals);
    const filter = typeof values.filter === 'string' ? values.filter : undefined;
    const only = typeof values.only === 'string' ? values.only : undefined;

    const { repoRoot, workspaces: affectedWorkspaces } = await getAffectedWorkspaces(process.cwd());

    const workspaces =
        filter !== undefined
            ? affectedWorkspaces.filter(workspace => workspace.name.includes(filter))
            : affectedWorkspaces;

    const results = await runRequirements({
        requirements,
        repoRoot,
        workspaces,
        filter: only,
        mode,
    });

    const exitCode = report(results);
    process.exit(exitCode);
};

main();
