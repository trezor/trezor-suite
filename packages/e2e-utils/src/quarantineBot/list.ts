import { extractKeyFromAction } from './actions';
import { AUTO_QUARANTINE_PREFIX, PROJECTS } from './config';
import { getAllQuarantineActions } from '../currentsApi/api';
import type { Action } from '../currentsApi/types';
import { debug, error, log, output } from '../logger';

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
 * Progress messages go to stderr; only the final JSON report goes to stdout,
 * making it easy to capture with shell redirection:
 *   node ... --list > quarantine.json
 *   node ... --list --project web > quarantine-web.json
 */
export async function listAllQuarantinedTests(projectNameFilter?: string): Promise<void> {
    const projects = projectNameFilter
        ? PROJECTS.filter(p => p.name === projectNameFilter)
        : PROJECTS;

    if (projectNameFilter && projects.length === 0) {
        error(
            `No project found with name "${projectNameFilter}". Known names: ${PROJECTS.map(p => p.name).join(', ')}`,
        );
        process.exit(1);
    }

    log('=== Currents Quarantine List ===');
    log(`Timestamp: ${new Date().toISOString()}`);
    log(`Projects: ${projects.map(p => `${p.label} (${p.id})`).join(', ')}`);
    log('');

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

            log(`[${project.label}] ${tests.length} quarantined test(s)`);
            for (const t of tests) {
                const tag = t.isAutoQuarantine ? ' [auto]' : ' [manual]';
                log(`  - ${t.name}${tag}`);
                debug(`    spec=${t.spec ?? '(none)'} isAuto=${t.isAutoQuarantine}`);
            }
        } catch (err) {
            error(`Failed fetching quarantine actions for ${project.label}: ${err}`);
            hasError = true;
        }
    }

    // Emit the machine-readable JSON on stdout.
    output(JSON.stringify(report, null, 2));

    if (hasError) {
        process.exit(1);
    }
}
