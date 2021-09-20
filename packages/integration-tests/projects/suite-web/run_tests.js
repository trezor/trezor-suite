/* eslint-disable no-continue */
/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-var-requires */

/*
    Heavily inspired by Mattermost,
    https://github.com/mattermost/mattermost-webapp/blob/master/e2e/run_tests.js good job guys.
*/
const cypress = require('cypress');
const shell = require('shelljs');
const { argv } = require('yargs');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const TEST_DIR = './packages/integration-tests/projects/suite-web';

const getGrepCommand = (word = '', args = '-rlIw', path = TEST_DIR) =>
    // -r, recursive search on subdirectories
    // -I, ignore binary
    // -l, only names of files to stdout/return
    // -w, expression is searched for as a word
    `grep ${args} '${word}' ${path}`;

/**
 * get value of labels, for example there is
 * @retry=3 in ./tests/backup.test.ts
 * grepForValue('@retry', './tests/backup.test.ts');
 * will return 3
 */
const grepForValue = (word, path) => {
    const gc = getGrepCommand(word, '-rIw', path);
    const result = shell.exec(gc, { silent: true }).stdout;
    return result.replace(`// ${word}=`, '');
};

function getTestFiles() {
    const { stage } = argv;
    let command;
    if (stage) {
        // for arrays
        // command = getGrepCommand(stage.split(',').join('\\|'))
        command = getGrepCommand(stage);
    } else {
        command = getGrepCommand();
    }
    return shell
        .exec(command, { silent: true })
        .stdout.split('\n')
        .filter(f => f.includes('.test.'));
}

async function runTests() {
    const {
        BROWSER = 'chrome',
        CYPRESS_baseUrl, // eslint-disable-line @typescript-eslint/naming-convention
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
    } = process.env;

    const { stage } = argv;

    if (!TRACK_SUITE_URL || CYPRESS_updateSnapshots) {
        console.log(
            '[run_tests.js] TRACK_SUITE_URL env not specified or CYPRESS_updateSnapshots is set. No logs will be uploaded',
        );
    }
    const finalTestFiles = getTestFiles().sort((a, b) => a.localeCompare(b));

    if (!finalTestFiles.length) {
        console.log('[run_tests.js] nothing to test!');
        return;
    }

    console.log('[run_tests.js] test files after all filters:', finalTestFiles);

    let failedTests = 0;

    const log = {
        jobUrl: CI_JOB_URL,
        jobId: CI_JOB_ID,
        branch: CI_COMMIT_BRANCH,
        commitMessage: CI_COMMIT_MESSAGE,
        commitSha: CI_COMMIT_SHA,
        runnerDescription: CI_RUNNER_DESCRIPTION,
        duration: 0,
        stage,
        records: {},
        tests: [],
    };

    for (let i = 0; i < finalTestFiles.length; i++) {
        const testFile = finalTestFiles[i];
        const retries = Number(grepForValue('@retry', testFile));
        const allowedRuns = !Number.isNaN(retries) && Number(ALLOW_RETRY) ? retries + 1 : 1;

        const spec = path.join(__dirname, testFile.substr(testFile.lastIndexOf('/tests')));
        const testFileName = testFile
            .substr(testFile.lastIndexOf('/tests/') + 7)
            .replace('.test.ts', '');

        let testRunNumber = 0;

        const userAgent = grepForValue('@user-agent', testFile);

        console.log('');
        console.log(`[run_tests.js] testing next file ${testFile}`);
        console.log(`[run_tests.js] allowed to run ${allowedRuns} times`);

        const config = {
            baseUrl: CYPRESS_baseUrl, // eslint-disable-line @typescript-eslint/naming-convention
            supportFile: `${__dirname}/support/index.ts`,
            pluginsFile: `${__dirname}/plugins/index.js`,
            screenshotsFolder: `${__dirname}/screenshots`,
            integrationFolder: `${__dirname}/tests`,
            videosFolder: `${__dirname}/videos`,
            downloadsFolder: `${__dirname}/downloads`,
            video: true,
            chromeWebSecurity: false,
            trashAssetsBeforeRuns: false,
            defaultCommandTimeout: 15000,
            env: {
                emuVersionT1: '1-master',
                emuVersionT2: '2-master',
            },
        };

        if (userAgent) {
            console.log('[run_tests.js] using custom user agent', userAgent);
            Object.assign(config, { userAgent });
        }

        while (testRunNumber < allowedRuns) {
            testRunNumber++;
            try {
                // eslint-disable-next-line no-await-in-loop
                const runResult = await cypress.run({
                    browser: BROWSER,
                    // headless,
                    headed: true,
                    spec,
                    config,
                    configFile: false,
                });

                const { totalFailed, totalPending, totalDuration } = runResult;

                const { tests } = runResult.runs[0];

                console.log(`[run_tests.js] ${testFileName} duration: ${totalDuration}`);
                log.duration += totalDuration;

                if (totalFailed > 0) {
                    // record failed tests if it is last run
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
        if (response.error) {
            console.log('[run_tests.js] response.error', response.error);
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
            git commit -m "e2e${stage ? `(${stage}):` : ':'} update snapshots"
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
}

runTests();
