/* eslint-disable no-console */
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export const uploadToCurrents = (projectName: string): void => {
    const reportPath = path.resolve(process.cwd(), 'reports', `${projectName}-junit-report.xml`);
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
            `npx currents convert --input-format=junit --input-file="${reportPath}" --output-dir="${currentsDir}" --framework=postman --framework-version=v11.2.0`,
            { stdio: 'inherit', env: process.env },
        );

        console.log(`Uploading report for ${projectName} to Currents...`);
        execSync(
            `npx currents upload --project-id=${process.env.CURRENTS_PROJECT_ID} --key=${process.env.CURRENTS_RECORD_KEY} --ci-build-id=${process.env.CURRENTS_CI_BUILD_ID} --report-dir "${currentsDir}"`,
            { stdio: 'inherit', env: process.env },
        );
    } catch (error) {
        console.error(`Failed to upload to Currents for ${projectName}:`, error);
    }
};
