import { extractKeyFromAction } from './actions';
import { getAutoQuarantineActions } from './api';
import { PROJECTS } from './config';
import { deleteAction } from '../currentsApi/api';
import { createLogger } from '../logger';

const logger = createLogger('wipe');

export async function wipeAllAutoQuarantineActions(): Promise<void> {
    logger.log('=== Wipe Auto-Quarantine Actions ===');
    logger.log(`Timestamp: ${new Date().toISOString()}`);
    logger.log(`Projects: ${PROJECTS.map(p => `${p.label} (${p.id})`).join(', ')}`);
    logger.log('');

    let hasError = false;

    for (const project of PROJECTS) {
        try {
            logger.log(`\n── [${project.label}] Fetching auto-quarantine actions ──`);
            const actions = await getAutoQuarantineActions(project.id);

            if (actions.length === 0) {
                logger.log('  ✓ No auto-quarantine actions found.');
                continue;
            }

            logger.log(`  Found ${actions.length} auto-quarantine action(s). Deleting...`);

            for (const action of actions) {
                const testKey = extractKeyFromAction(action);
                const testTitle = testKey
                    ? (JSON.parse(testKey) as string[]).join(' > ')
                    : action.name;
                logger.log(`  ↳ Deleting: "${testTitle.slice(0, 80)}"`);
                logger.debug(`    actionId=${action.actionId} name="${action.name}"`);
                await deleteAction(action.actionId);
            }

            logger.log(`  ✓ Deleted ${actions.length} action(s) for [${project.label}].`);
        } catch (err) {
            logger.error(`\nFailed wiping project ${project.label} (${project.id}):`, err);
            hasError = true;
        }
    }

    logger.log('\n=== Done ===');

    if (hasError) {
        process.exit(1);
    }
}
