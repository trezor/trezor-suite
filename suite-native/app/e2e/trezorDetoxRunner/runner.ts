/* eslint-disable no-console */
import * as path from 'path';

import { uploadToCurrents } from './currentsUpload';
import { runProjectSafely } from './detox';
import {
    DETOX_ARTIFACTS_DIR,
    findNewDetoxArtifactsRootDir,
    listDetoxArtifactsRootDirs,
} from './detoxArtifacts';
import { processJUnitReport } from './junitReport';
import type { Action } from './quarantine';
import { readTestAttempts } from './testAttempts';
import { extractTrezorUserEnvLogs } from './trezorUserEnvLogs';
import type { ProjectConfig } from './types';

// Only the Android CI jobs run trezor-user-env in Docker, iOS runs device-less tests only.
const shouldExtractTrezorUserEnvLogs = (project: ProjectConfig): boolean =>
    Boolean(process.env.GITHUB_ACTION) && project.target.startsWith('android');

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
        const previousArtifactsRootDirs = listDetoxArtifactsRootDirs(project.target);
        const detoxFailed = await runProjectSafely(project, headless, testFiles);
        const artifactsRootDir = findNewDetoxArtifactsRootDir(
            project.target,
            previousArtifactsRootDirs,
        );
        const instanceAttachments = shouldExtractTrezorUserEnvLogs(project)
            ? extractTrezorUserEnvLogs(
                  path.join(DETOX_ARTIFACTS_DIR, `trezor-user-env.${project.projectName}`),
              )
            : [];
        const hasRemainingFailures = await processJUnitReport({
            projectName: project.projectName,
            detoxFailed,
            grep: project.grep,
            quarantinedActions,
            testAttempts: readTestAttempts(project.projectName),
            artifactsRootDir,
            instanceAttachments,
        });
        uploadToCurrents(project.projectName, quarantinedActions);

        // A project fails only when non-quarantined failures remain,
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
