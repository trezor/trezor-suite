/*
    Heavily inspired by Mattermost,
    https://github.com/mattermost/mattermost-webapp/blob/master/e2e/run_tests.js good job guys.
*/
const cypress = require('cypress');
const shell = require('shelljs');
const argv = require('yargs').argv;
const fetch = require('node-fetch')

const TEST_DIR = './packages/integration-tests/projects/suite-web';

const getGrepCommand = (word = '', args = '-rlIw', path=TEST_DIR) => {
    // -r, recursive search on subdirectories
    // -I, ignore binary
    // -l, only names of files to stdout/return
    // -w, expression is searched for as a word
    return `grep ${args} '${word}' ${path}`;
};

/**
 * get value of labels, for example there is 
 * @retry=3 in ./tests/backup.test.ts
 * grepForValue('@retry', './tests/backup.test.ts');
 * will return 3
 */
const grepForValue = (word, path) => {
    const gc = getGrepCommand(word, '-rIw', path);
    const result =  shell.exec(gc, {silent: true}).stdout
    return result.replace(`// ${word}=`, '')
}

function getTestFiles() {
    const {stage} = argv;
    let command;
    if (stage) {
        // for arrays
        // command = getGrepCommand(stage.split(',').join('\\|'))
        command = getGrepCommand(stage);
    } else {
        command = getGrepCommand();
    }
    return shell.exec(command, {silent: true})
        .stdout
        .split('\n')
        .filter((f) => f.includes('.test.'));
}

async function runTests() {
    const {
        BROWSER = 'chrome',
        CYPRESS_baseUrl, // eslint-disable-line camelcase
        TRACK_SUITE_URL,
        CI_JOB_URL,
        CI_COMMIT_BRANCH,
        CI_JOB_ID,
        CI_COMMIT_MESSAGE,
    } = process.env;
    
    const {stage} = argv;
    
    if (!TRACK_SUITE_URL) {
        console.log('[run_tests.js] TRACK_SUITE_URL env not specified. No logs will be uploaded');
    }
    const finalTestFiles = getTestFiles().sort((a, b) => a.localeCompare(b));

    if (!finalTestFiles.length) {
        console.log('[run_tests.js] nothing to test!');
        return;
    }

    console.log('[run_tests.js] test files after all filters:', finalTestFiles)

    let totalRetries = 0;
    let failedTests = 0;

    let log = {
        jobUrl: CI_JOB_URL,
        jobId: CI_JOB_ID,
        branch: CI_COMMIT_BRANCH,
        commitMessage: CI_COMMIT_MESSAGE,
        stage,
        records: {}
    };

    for (let i = 0; i < finalTestFiles.length; i++) {
        const testFile = finalTestFiles[i];
        const retries = Number(grepForValue('@retry', testFile));
        const allowedRuns = !isNaN(retries) ? retries + 1 : 1;

        const spec = __dirname + testFile.substr(testFile.lastIndexOf('/tests'));
        const testFileName = testFile.substr(testFile.lastIndexOf('/tests/') + 7).replace('.test.ts', '');

        let testRunNumber = 0;

        const userAgent = grepForValue('@user-agent', testFile);

        console.log('');
        console.log(`[run_tests.js] testing next file ${testFile}`);
        console.log(`[run_tests.js] allowed to run ${allowedRuns} times`);

        const config = {
            baseUrl: CYPRESS_baseUrl,
            supportFile: `${__dirname}/support/index.ts`,
            pluginsFile: `${__dirname}/plugins/index.js`,
            screenshotsFolder: `${__dirname}/screenshots`,
            integrationFolder: `${__dirname}/tests`,
            videosFolder: `${__dirname}/videos`,
            video: true,
            chromeWebSecurity: false,
            trashAssetsBeforeRuns: false,
        };

        if (userAgent) {
            console.log('[run_tests.js] using custom user agent', userAgent);
            Object.assign(config, { userAgent });
        }

        while(testRunNumber < allowedRuns) {
            testRunNumber++;
            try {
                const {totalFailed } = await cypress.run({
                    browser: BROWSER,
                    // headless,
                    headed: true,
                    spec,
                    config,
                    configFile: false,
                });

                if (totalFailed === 0) {
                    // log either success or retried (success after retry)
                    log.records[testFileName] = testRunNumber === 1 ? 'success': 'retried';
                    console.log(`[run_tests.js] test ${testFileName} finished as successful after ${allowedRuns} run(s)`);
                    break;
                }
    
                // record failed tests if it is last run
                if (testRunNumber === allowedRuns) {
                    failedTests += totalFailed;
                    log.records[testFileName] = 'failed';
                    console.log(`[run_tests.js] test ${testFileName} finished failing after ${allowedRuns} run(s)`);
                    break;
                }
                console.log(`[run_tests.js] failed in run number ${testRunNumber} of ${allowedRuns}`);
                totalRetries++;

            } catch (err) {
                console.log('[run_tests.js] error');
                console.log(err);
                process.exit(1);
            }
        }
    }

    if (TRACK_SUITE_URL) {
        console.log(`[run_tests.js] uploading logs to ${TRACK_SUITE_URL}. Logs: ${JSON.stringify(log, null, 2)}`);
        const response = await fetch(`${TRACK_SUITE_URL}/api/test-records`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(log),
        })
        console.log(`[run_tests.js] response.status: ${response.status}`);
        if (response.error) {
            console.log('[run_tests.js] response.error', response.error);
        }
    } 
    
    console.log(`[run_tests.js] retry ratio: ${((totalRetries / finalTestFiles.length) * 100).toFixed(2)}% `)
    
    // beta is only for collecting statistics, so it exits with non-zero code 
    // if there is some runtime error.
    if (stage === '@beta') {
        process.exit(0);
    }
    process.exit(failedTests);
}

runTests();

