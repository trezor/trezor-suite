import { scheduleAction } from '@trezor/utils';

import { ProjectRequests } from '../projectRequests';
import { RETRY_CONF, createLogger, createOctokit, resolveSandboxProject } from './sandboxProject';

// Deletes every item in the sandbox project so each reporter watchdog run starts from a clean slate.
async function main() {
    const logger = createLogger('Reporter Watchdog Wipe');
    const octokit = createOctokit();
    const projects = new ProjectRequests(octokit, logger);

    const project = await resolveSandboxProject(projects);
    logger.log(`Wiping project "${project.title}" (${project.id})`);

    const items = await scheduleAction(() => projects.getProjectItems(project.id), RETRY_CONF);
    logger.log(`Found ${items.length} item(s) to delete`);

    for (const item of items) {
        await scheduleAction(() => projects.deleteProjectV2Item(project.id, item.id), RETRY_CONF);
        logger.log(`Deleted item ${item.id} ("${item.content?.title ?? 'untitled'}")`);
    }

    const remaining = await scheduleAction(() => projects.getProjectItems(project.id), RETRY_CONF);
    if (remaining.length > 0) {
        throw new Error(`Wipe incomplete: ${remaining.length} item(s) still present`);
    }
    logger.log('Sandbox project is clean');
}

main().catch(error => {
    console.error('Wipe failed:', error?.message || error);
    process.exit(1);
});
