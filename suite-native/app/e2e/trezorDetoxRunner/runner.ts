/* eslint-disable no-console */
import { uploadToCurrents } from './currentsUpload';
import { runProjectSafely } from './detox';
import { processJUnitReport } from './junitReport';
import type { Action } from './quarantine';
import type { ProjectConfig } from './types';

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

    if (failedProjects.length > 0) {
        console.error('\nThe following projects failed:');
        failedProjects.forEach(name => console.error(`- ${name}`));
        process.exit(1);
    } else {
        console.log('\nAll projects passed successfully');
    }
};
