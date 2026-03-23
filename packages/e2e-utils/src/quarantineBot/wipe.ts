import { extractKeyFromAction } from './actions';
import { getAutoQuarantineActions } from './api';
import { PROJECTS } from './config';
import { deleteAction } from '../currentsApi/api';
import { debug, error, log } from '../logger';

export async function wipeAllAutoQuarantineActions(): Promise<void> {
    log('=== Wipe Auto-Quarantine Actions ===');
    log(`Timestamp: ${new Date().toISOString()}`);
    log(`Projects: ${PROJECTS.map(p => `${p.label} (${p.id})`).join(', ')}`);
    log('');

    let hasError = false;

    for (const project of PROJECTS) {
        try {
            log(`\n── [${project.label}] Fetching auto-quarantine actions ──`);
            const actions = await getAutoQuarantineActions(project.id);

            if (actions.length === 0) {
                log('  ✓ No auto-quarantine actions found.');
                continue;
            }

            log(`  Found ${actions.length} auto-quarantine action(s). Deleting...`);

            for (const action of actions) {
                const testKey = extractKeyFromAction(action);
                const testTitle = testKey
                    ? (JSON.parse(testKey) as string[]).join(' > ')
                    : action.name;
                log(`  ↳ Deleting: "${testTitle.slice(0, 80)}"`);
                debug(`    actionId=${action.actionId} name="${action.name}"`);
                await deleteAction(action.actionId);
            }

            log(`  ✓ Deleted ${actions.length} action(s) for [${project.label}].`);
        } catch (err) {
            error(`\nFailed wiping project ${project.label} (${project.id}):`, err);
            hasError = true;
        }
    }

    log('\n=== Done ===');

    if (hasError) {
        process.exit(1);
    }
}
