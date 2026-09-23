/* eslint-disable no-console */
import { uploadToCurrents } from './currentsUpload';
import { runProjectSafely } from './detox';
import { processJUnitReport } from './junitReport';
import type { Action } from './quarantine';
import type { ProjectConfig } from './types';

/**
 * Performance metrics are a by-product of the run and must never change its verdict. The module is
 * loaded lazily so that a broken import in the collection pipeline cannot take the runner down
 * before a single test has started.
 */
const collectPerformanceSafely = async (projects: ProjectConfig[]): Promise<void> => {
    try {
        const { collectPerformanceReport } = await import('../performance/collectPerformance');

        collectPerformanceReport(projects.map(project => project.target));
    } catch (error) {
        console.warn('Failed to collect the performance report, continuing:', error);
    }
};

export const runAllProjects = async (
    projects: ProjectConfig[],
    headless: boolean,
    testFiles: string[],
    quarantinedActions: Action[] = [],
): Promise<void> => {
    const failedProjects: string[] = [];

    for (const project of projects) {
        const detoxFailed = await runProjectSafely(project, headless, testFiles);
        const hasRemainingFailures = await processJUnitReport(
            project.projectName,
            detoxFailed,
            project.grep,
            quarantinedActions,
        );
        uploadToCurrents(project.projectName);

        // A project fails only when the (post-quarantine) report still contains failures,
        // or when Detox crashed without producing a report at all.
        if (hasRemainingFailures) {
            failedProjects.push(project.projectName);
        }
    }

    await collectPerformanceSafely(projects);

    if (failedProjects.length > 0) {
        console.error('\nThe following projects failed:');
        failedProjects.forEach(name => console.error(`- ${name}`));
        process.exit(1);
    } else {
        console.log('\nAll projects passed successfully');
    }
};
