/* eslint-disable no-console */
import * as path from 'path';

import { uploadToCurrents } from './currentsUpload';
import { runProjectSafely } from './detox';
import {
    DETOX_ARTIFACTS_DIR,
    findNewDetoxArtifactsRootDir,
    listDetoxArtifactsRootDirs,
} from './detoxArtifacts';
import { getJUnitReportPath, processJUnitReport } from './junitReport';
import type { Action } from './quarantine';
import { getTestAttemptsPath, readTestAttempts } from './testAttempts';
import { extractTrezorUserEnvLogs } from './trezorUserEnvLogs';
import type { ProjectConfig } from './types';

// Only the Android CI jobs run trezor-user-env in Docker, iOS runs device-less tests only.
const shouldExtractTrezorUserEnvLogs = (project: ProjectConfig): boolean =>
    Boolean(process.env.GITHUB_ACTION) && project.target.startsWith('android');

export const runAllProjects = async (
    projects: ProjectConfig[],
    headless: boolean,
    testFiles: string[],
    quarantinedActions: Action[] = [],
): Promise<void> => {
    const failedProjects: string[] = [];

    for (const project of projects) {
        const previousArtifactsRootDirs = listDetoxArtifactsRootDirs({
            detoxConfiguration: project.target,
        });
        const detoxFailed = await runProjectSafely(project, headless, testFiles);
        const artifactsRootDir = findNewDetoxArtifactsRootDir({
            detoxConfiguration: project.target,
            previousRootDirs: previousArtifactsRootDirs,
        });
        const instanceAttachments = shouldExtractTrezorUserEnvLogs(project)
            ? extractTrezorUserEnvLogs(
                  path.join(DETOX_ARTIFACTS_DIR, `trezor-user-env.${project.projectName}`),
              )
            : [];
        const hasRemainingFailures = await processJUnitReport({
            projectName: project.projectName,
            reportPath: getJUnitReportPath(project.projectName),
            detoxFailed,
            grep: project.grep,
            quarantinedActions,
            testAttempts: readTestAttempts(getTestAttemptsPath(project.projectName)),
            artifactsRootDir,
            instanceAttachments,
        });
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
