/* eslint-disable no-console */
import { extractKeyFromAction } from './actions';
import { AUTO_QUARANTINE_PREFIX, PROJECTS } from './config';
import { getAllQuarantineActions } from '../currentsApi/api';
import type { Action } from '../currentsApi/types';

interface QuarantinedTestEntry {
    name: string;
    spec?: string;
    isAutoQuarantine: boolean;
}

interface ProjectQuarantineReport {
    projectId: string;
    projectLabel: string;
    tests: QuarantinedTestEntry[];
}

/**
 * List all quarantined tests for every project and write a JSON report to stdout.
 *
 * Human-readable progress messages are written to stderr so that stdout contains
 * only the JSON output, making it easy to capture with shell redirection:
 *   node ... --list > quarantine.json
 *   node ... --list --project web > quarantine-web.json
 */
export async function listAllQuarantinedTests(projectNameFilter?: string): Promise<void> {
    const projects = projectNameFilter
        ? PROJECTS.filter(p => p.name === projectNameFilter)
        : PROJECTS;

    if (projectNameFilter && projects.length === 0) {
        process.stderr.write(
            `[ERROR] No project found with name "${projectNameFilter}". Known names: ${PROJECTS.map(p => p.name).join(', ')}\n`,
        );
        process.exit(1);
    }

    process.stderr.write(`=== Currents Quarantine List ===\n`);
    process.stderr.write(`Timestamp: ${new Date().toISOString()}\n`);
    process.stderr.write(`Projects: ${projects.map(p => `${p.label} (${p.id})`).join(', ')}\n\n`);

    const report: ProjectQuarantineReport[] = [];
    let hasError = false;

    for (const project of projects) {
        try {
            const actions = await getAllQuarantineActions(project.id);

            const tests: QuarantinedTestEntry[] = actions.map((action: Action) => {
                const testKey = extractKeyFromAction(action);
                const name = testKey ? (JSON.parse(testKey) as string[]).join(' > ') : action.name;

                // Try to extract spec from a dedicated spec condition in the matcher.
                const specCond = action.matcher?.cond?.find(c => c.type === 'spec');
                const spec =
                    specCond && typeof specCond.value === 'string' ? specCond.value : undefined;

                return {
                    name,
                    spec,
                    isAutoQuarantine: action.name.startsWith(AUTO_QUARANTINE_PREFIX),
                };
            });

            report.push({
                projectId: project.id,
                projectLabel: project.label,
                tests,
            });

            process.stderr.write(`[${project.label}] ${tests.length} quarantined test(s)\n`);
            for (const t of tests) {
                const tag = t.isAutoQuarantine ? ' [auto]' : ' [manual]';
                process.stderr.write(`  - ${t.name}${tag}\n`);
            }
        } catch (err) {
            process.stderr.write(
                `[ERROR] Failed fetching quarantine actions for ${project.label}: ${err}\n`,
            );
            hasError = true;
        }
    }

    // Emit the machine-readable JSON on stdout.
    console.log(JSON.stringify(report, null, 2));

    if (hasError) {
        process.exit(1);
    }
}
