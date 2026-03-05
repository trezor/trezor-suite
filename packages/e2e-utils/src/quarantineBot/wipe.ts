/* eslint-disable no-console */
import { extractKeyFromAction } from './actions';
import { deleteAction, getAutoQuarantineActions } from './api';
import { PROJECTS } from './config';

export async function wipeAllAutoQuarantineActions(): Promise<void> {
    console.log('=== Wipe Auto-Quarantine Actions ===');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Projects: ${PROJECTS.map(p => `${p.label} (${p.id})`).join(', ')}`);
    console.log('');

    let hasError = false;

    for (const project of PROJECTS) {
        try {
            console.log(`\n── [${project.label}] Fetching auto-quarantine actions ──`);
            const actions = await getAutoQuarantineActions(project.id);

            if (actions.length === 0) {
                console.log('  ✓ No auto-quarantine actions found.');
                continue;
            }

            console.log(`  Found ${actions.length} auto-quarantine action(s). Deleting...`);

            for (const action of actions) {
                const testKey = extractKeyFromAction(action);
                const testTitle = testKey
                    ? (JSON.parse(testKey) as string[]).join(' > ')
                    : action.name;
                console.log(`  ↳ Deleting: "${testTitle.slice(0, 80)}"`);
                await deleteAction(action.actionId);
            }

            console.log(`  ✓ Deleted ${actions.length} action(s) for [${project.label}].`);
        } catch (err) {
            console.error(`\n[ERROR] Failed wiping project ${project.label} (${project.id}):`, err);
            hasError = true;
        }
    }

    console.log('\n=== Done ===');

    if (hasError) {
        process.exit(1);
    }
}
