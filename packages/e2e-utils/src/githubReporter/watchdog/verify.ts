import { scheduleAction } from '@trezor/utils';

import { TestStatus } from '../../enums/testAnnotations';
import { ProjectRequests } from '../projectRequests';
import { type ProjectItem } from '../types';
import {
    EXPECTED_MANUAL,
    EXPECTED_NATIVE_MANUAL,
    REPORTER_WATCHDOG_AUTOMATED_SAMPLES,
} from './samples';
import { RETRY_CONF, createLogger, createOctokit, resolveSandboxProject } from './sandboxProject';

// Flattens an item's field values into a { fieldName: value } map.
const fieldMap = (item: ProjectItem): Record<string, string> => {
    const map: Record<string, string> = {};
    for (const node of item.fieldValues.nodes) {
        if (node.field?.name) {
            map[node.field.name] = node.name ?? node.text ?? '';
        }
    }

    return map;
};

async function main() {
    const logger = createLogger('Reporter Watchdog Verify');
    const octokit = createOctokit();
    const projects = new ProjectRequests(octokit, logger);

    const project = await resolveSandboxProject(projects);
    logger.log(`Verifying project "${project.title}" (${project.id})`);

    const items = await scheduleAction(() => projects.getProjectItems(project.id), RETRY_CONF);
    logger.log(`Found ${items.length} item(s)`);

    const errors: string[] = [];
    const expectAutomated = process.env.REPORTER_WATCHDOG_EXPECT_AUTOMATED !== 'false';

    // 1. Automated failures must create an Auto FAIL issue; automated passes must create nothing.
    if (expectAutomated) {
        for (const sample of REPORTER_WATCHDOG_AUTOMATED_SAMPLES) {
            const item = items.find(i => i.content?.title === sample.testCase);
            if (sample.shouldFail) {
                if (!item) {
                    errors.push(`Missing automated FAIL issue "${sample.testCase}"`);
                } else if (fieldMap(item).Status !== TestStatus.AutoFail) {
                    errors.push(
                        `Automated FAIL issue "${sample.testCase}" has Status "${fieldMap(item).Status}", expected "${TestStatus.AutoFail}"`,
                    );
                }
            } else if (item) {
                errors.push(
                    `Automated PASS issue "${sample.testCase}" should be absent but was found`,
                );
            }
        }
    }

    // 2. Each manual sample (web + native) must be present with its fields resolved.
    for (const expected of [...EXPECTED_MANUAL, ...EXPECTED_NATIVE_MANUAL]) {
        const item = items.find(i => i.content?.title === expected.title);
        if (!item) {
            errors.push(`Missing manual issue "${expected.title}"`);
            continue;
        }

        const values = fieldMap(item);
        for (const [field, value] of Object.entries(expected.fields)) {
            if (values[field] !== value) {
                errors.push(
                    `Manual issue "${expected.title}" field "${field}" is "${values[field]}", expected "${value}"`,
                );
            }
        }
    }

    // 3. Every issue must carry a Release Build value (covers the TEXT field write path).
    for (const item of items) {
        if (!fieldMap(item)['Release Build']) {
            errors.push(`Issue "${item.content?.title ?? item.id}" has empty "Release Build"`);
        }
    }

    if (errors.length > 0) {
        logger.logError(`Reporter watchdog verification FAILED with ${errors.length} problem(s):`);
        errors.forEach(e => logger.logError(`  - ${e}`));
        process.exit(1);
    }

    logger.log('Reporter watchdog verification PASSED');
}

main().catch(error => {
    console.error('Verify failed:', error?.message || error);
    process.exit(1);
});
