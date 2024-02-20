/*
    Heavily inspired by Mattermost,
    https://github.com/mattermost/mattermost-webapp/blob/master/e2e/run_tests.js good job guys.
*/
import cypress from 'cypress';
import child_process from 'child_process';
import yargs from 'yargs/yargs';
import path from 'path';
import fs from 'fs';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import cypressConfig from './cypress.config';

const TEST_DIR = './packages/suite-web/e2e/';

const { argv } = yargs(process.argv.slice(2)).options({
    group: { type: 'string' },
});

const getGrepCommand = (word = '', args = '-rlIw', path = TEST_DIR) =>
    // -r, recursive search on subdirectories
    // -I, ignore binary
    // -l, only names of files to stdout/return
    // -w, expression is searched for as a word
    [args, word, path];

/**
 * get value of labels, for example there is
 * @retry=3 in ./tests/backup.test.ts
 * grepForValue('@retry', './tests/backup.test.ts');
 * will return 3
 */
const grepForValue = (word: string, path: string) => {
    const command = getGrepCommand(word, '-rIw', path);
    const res = child_process.spawnSync('grep', command, {
        encoding: 'utf-8',
    });

    if (res.stderr) {
        throw new Error(res.stderr);
    }

    return res.stdout.replace(`// ${word}=`, '');
};

const getTestFiles = async (): Promise<string[]> => {
    const { group } = await argv;
    let command;
    if (group) {
        // for arrays
        // command = getGrepCommand(stage.split(',').join('\\|'))
        command = getGrepCommand(group);
    } else {
        command = getGrepCommand();
    }

    const res = child_process.spawnSync('grep', command, {
        encoding: 'utf-8',
    });

    if (res.error) {
        throw new Error(res.error.message);
    }

    return res.stdout.split('\n').filter((f: string) => f.includes('.test.'));
};

const runTests = async () => {
    await TrezorUserEnvLink.connect();

    const {
        BROWSER = 'chrome',
        CYPRESS_baseUrl,
        TRACK_SUITE_URL,
        ALLOW_RETRY,
        CI_JOB_URL,
        CI_COMMIT_BRANCH,
        CI_JOB_ID,
        CI_COMMIT_MESSAGE,
        CI_COMMIT_SHA,
        // CI_RUNNER_ID,
        CI_RUNNER_DESCRIPTION,
        CYPRESS_updateSnapshots,
        CYPRESS_TEST_URLS,
    } = process.env;

    if (!CYPRESS_TEST_URLS) {
        throw new Error('CYPRESS_TEST_URLS is not set');
    }

    const { group } = await argv;

    if (!TRACK_SUITE_URL || CYPRESS_updateSnapshots) {
        console.log(
            '[run_tests.js] TRACK_SUITE_URL env not specified or CYPRESS_updateSnapshots is set. No logs will be uploaded',
        );
    }
    const finalTestFiles = (await getTestFiles()).sort((a: string, b: string) =>
        a.localeCompare(b),
    );

    if (!finalTestFiles.length) {
        console.log('[run_tests.js] nothing to test!');

        return;
    }

    console.log('[run_tests.js] test files after all filters:', finalTestFiles);

    let failedTests = 0;

    interface Log {
        jobUrl?: string;
        jobId?: string;
        branch?: string;
        commitMessage?: string;
        commitSha?: string;
        runnerDescription?: string;
        duration: number;
        stage?: string;
        records: { [key: string]: 'success' | 'failed' | 'retried' | 'skipped' };
        tests: CypressCommandLine.TestResult[];
    }

    const log: Log = {
        jobUrl: CI_JOB_URL,
        jobId: CI_JOB_ID,
        branch: CI_COMMIT_BRANCH,
        commitMessage: CI_COMMIT_MESSAGE,
        commitSha: CI_COMMIT_SHA,
        runnerDescription: CI_RUNNER_DESCRIPTION,
        duration: 0,
        stage: group,
        records: {},
        tests: [],
    };

    for (let i = 0; i < finalTestFiles.length; i++) {
        const testFile = finalTestFiles[i];
        const retries = Number(grepForValue('@retry', testFile));
        const allowedRuns = !Number.isNaN(retries) && Number(ALLOW_RETRY) ? retries + 1 : 1;

        const spec = path.join(__dirname, testFile.substring(testFile.lastIndexOf('/tests')));
        const testFileName = testFile
            .substring(testFile.lastIndexOf('/tests/') + 7)
            .replace('.test.ts', '');

        console.log('');
        console.log(`[run_tests.js] testing next file ${testFile}`);
        console.log(`[run_tests.js] allowed to run ${allowedRuns} times`);

        const config = {
            e2e: {
                ...cypressConfig.e2e,
                baseUrl: CYPRESS_baseUrl,
                supportFile: `${__dirname}/support/index.ts`,
                fixturesFolder: `${__dirname}/fixtures`,
                screenshotsFolder: `${__dirname}/screenshots`,
                videosFolder: `${__dirname}/videos`,
                downloadsFolder: `${__dirname}/downloads`,
                video: true,
                chromeWebSecurity: false,
                trashAssetsBeforeRuns: false,
                defaultCommandTimeout: 15000,
                env: {
                    TEST_URLS: CYPRESS_TEST_URLS.split(' '),
                },
            },
        };

        const userAgent = grepForValue('@user-agent', testFile);

        if (userAgent) {
            console.log('[run_tests.js] using custom user agent', userAgent);
            Object.assign(config.e2e, { userAgent });
        }

        let testRunNumber = 0;

        while (testRunNumber < allowedRuns) {
            testRunNumber++;

            console.log(`[run_tests.js] config.e2e.baseUrl: ${config.e2e.baseUrl}`);

            try {
                const runResult = await cypress.run({
                    browser: BROWSER,
                    // headless,
                    headed: true,
                    spec,
                    project: 'packages/suite-web/e2e',
                    config: config.e2e,
                });

                if ('status' in runResult && runResult.status === 'failed') {
                    // This block will only be entered if runResult is of type CypressFailedRunResult
                    throw new Error(runResult.message);
                }

                if (
                    'totalFailed' in runResult &&
                    'totalPending' in runResult &&
                    'totalDuration' in runResult
                ) {
                    // This block will only be entered if runResult is of type CypressRunResult

                    const { totalFailed, totalPending, totalDuration } = runResult;
                    const { tests } = runResult.runs[0];

                    console.log(`[run_tests.js] ${testFileName} duration: ${totalDuration}`);
                    log.duration += totalDuration;

                    if (totalFailed > 0) {
                        // record failed tests if it is the last run
                        if (testRunNumber === allowedRuns) {
                            failedTests += totalFailed;
                            log.records[testFileName] = 'failed';
                            log.tests.push(...tests);
                            console.log(
                                `[run_tests.js] test ${testFileName} finished failing after ${allowedRuns} run(s)`,
                            );
                            break;
                        }
                        // or continue
                        console.log(
                            `[run_tests.js] failed in run number ${testRunNumber} of ${allowedRuns}`,
                        );
                        continue;
                    }

                    log.tests.push(...tests);

                    if (totalPending > 0) {
                        // log either success or retried (success after retry)
                        log.records[testFileName] = 'skipped';
                        console.log(`[run_tests.js] test ${testFileName} finished as skipped`);
                        break;
                    }

                    // log either success or retried (success after retry)
                    log.records[testFileName] = testRunNumber === 1 ? 'success' : 'retried';
                    console.log(
                        `[run_tests.js] test ${testFileName} finished as successful after ${testRunNumber} run(s) (of ${allowedRuns})`,
                    );
                    break;
                }
            } catch (err) {
                console.log('[run_tests.js] error');
                console.log(err);
                process.exit(1);
            }
        }
    }

    if (TRACK_SUITE_URL && !CYPRESS_updateSnapshots) {
        console.log(`[run_tests.js] uploading logs to ${TRACK_SUITE_URL}.`);
        const response = await fetch(`${TRACK_SUITE_URL}/api/test-records`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(log),
        });
        console.log(`[run_tests.js] response.status: ${response.status}`);

        if (!response.ok) {
            console.log('[run_tests.js] response.error', response);
        }
    }

    console.log('CYPRESS_updateSnapshots', CYPRESS_updateSnapshots);

    if (CYPRESS_updateSnapshots) {
        const script = `
            #!/bin/sh
            diff_pre=$(git status --porcelain=v1 2>/dev/null | wc -l)
            if [ $diff_pre -gt 0 ]
            then
              echo "You have unstaged changes."
              exit 1
            fi
            mkdir tmp
            cd tmp
            wget ${CI_JOB_URL}/artifacts/download
            unzip download
            cp -rf packages/integration-tests/projects/suite-web/snapshots ../packages/integration-tests/projects/suite-web
            cd ../
            rm -rf ./tmp
            git status
            diff_after=$(git status --porcelain=v1 2>/dev/null | wc -l)
            if [ $diff_after -eq 0 ]
            then
              echo "There are no new snapshots."
              exit 0
            fi
            git add .
            git commit -m "e2e${group ? `(${group}):` : ':'} update snapshots"
            git log -n 2
            echo "You may now push your changes."
        `;

        console.log('Generated script to update files locally');
        console.log(script);

        console.log(`
        EXECUTE ^^ SCRIPT TO UPDATE SNAPSHOTS THAT CHANGED LOCALLY
        *******************************************************************

        curl ${CI_JOB_URL}/artifacts/raw/download-snapshots.sh | bash

        *******************************************************************
        `);

        fs.appendFileSync('download-snapshots.sh', script);
    } else {
        console.log(
            `[run_tests.js] Logs recorded ${TRACK_SUITE_URL}/#/${CI_COMMIT_BRANCH}/${CI_COMMIT_SHA}.`,
        );
    }

    process.exit(failedTests);
};

runTests();
