/* eslint-disable no-console */
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { getJUnitReportPath } from './junitReport';
import type { Action } from './quarantine';
import { isQuarantined } from './quarantine';

type CurrentsSuite = {
    tests: { title: string[]; tags?: string[] }[];
};

const tagQuarantinedTests = (currentsDir: string, quarantinedActions: Action[]): void => {
    const suitePath = path.join(currentsDir, 'fullTestSuite.json');
    const suites = JSON.parse(fs.readFileSync(suitePath, 'utf8')) as CurrentsSuite[];

    suites.forEach(suite => {
        suite.tests.forEach(test => {
            const testTitle = test.title.at(-1) ?? '';
            if (isQuarantined({ testTitle, titlePath: test.title }, quarantinedActions)) {
                test.tags = [...new Set([...(test.tags ?? []), 'quarantined'])];
            }
        });
    });

    fs.writeFileSync(suitePath, JSON.stringify(suites));
};

export const uploadToCurrents = (projectName: string, quarantinedActions: Action[]): void => {
    const reportPath = getJUnitReportPath(projectName);
    const currentsDir = path.resolve(process.cwd(), 'currents', projectName);

    if (!fs.existsSync(reportPath)) {
        console.warn(`Report not found at ${reportPath}, skipping Currents upload.`);

        return;
    }

    if (
        !process.env.CURRENTS_PROJECT_ID ||
        !process.env.CURRENTS_RECORD_KEY ||
        !process.env.CURRENTS_CI_BUILD_ID
    ) {
        console.warn(
            'Missing Currents environment variables (CURRENTS_PROJECT_ID, CURRENTS_RECORD_KEY, CURRENTS_CI_BUILD_ID), skipping upload.',
        );

        return;
    }

    try {
        console.log(`Converting JUnit report for ${projectName} to Currents format...`);
        execSync(
            `yarn exec currents convert --input-format=junit --input-file="${reportPath}" --output-dir="${currentsDir}" --framework=postman --framework-version=v11.2.0`,
            { stdio: 'inherit', env: process.env },
        );

        if (quarantinedActions.length > 0) {
            try {
                tagQuarantinedTests(currentsDir, quarantinedActions);
            } catch (error) {
                console.warn(`Failed to tag quarantined tests for ${projectName}:`, error);
            }
        }

        console.log(`Uploading report for ${projectName} to Currents...`);
        execSync(
            `yarn exec currents upload --project-id=${process.env.CURRENTS_PROJECT_ID} --key=${process.env.CURRENTS_RECORD_KEY} --ci-build-id=${process.env.CURRENTS_CI_BUILD_ID} --report-dir "${currentsDir}"`,
            { stdio: 'inherit', env: process.env },
        );
    } catch (error) {
        console.error(`Failed to upload to Currents for ${projectName}:`, error);
    }
};
