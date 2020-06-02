/*
    Heavily inspired by Mattermost, https://github.com/mattermost/mattermost-webapp/blob/master/e2e/run_tests.js good job guys.
*/

const cypress = require('cypress');
const shell = require('shelljs');
const argv = require('yargs').argv;
const fetch = require('node-fetch')

const TEST_DIR = './packages/integration-tests/projects/suite-web';

const grepCommand = (word = '', args = '-rlIw', path=TEST_DIR) => {
    // -r, recursive search on subdirectories
    // -I, ignore binary
    // -l, only names of files to stdout/return
    // -w, expression is searched for as a word
    return `grep ${args} '${word}' ${path}`;
};

const grepFiles = (command) => {
    return shell.exec(command, {silent: true})
        .stdout
        .split('\n')
        .filter((f) => f.includes('.test.'));
};

const grepForValue = (word, path) => {
    const gc = grepCommand(word, '-rIw', path);
    const result =  shell.exec(gc, {silent: true}).stdout
    return result.replace(`// ${word}=`, '')
}

function getTestFiles() {
    const {stage} = argv;
    let gc;
    if (stage) {
        gc = grepCommand(stage.split(',').join('\\|'))
    } else {
        gc = grepCommand();
    }
    return grepFiles(gc);
}

async function runTests() {
    const {
        BROWSER = 'chrome',
        CYPRESS_baseUrl, // eslint-disable-line camelcase
        TRACK_SUITE_URL,
        CI_JOB_URL,
        CI_COMMIT_BRANCH,
    } = process.env;
    
    let stage = [];
    if (argv.stage && Array.isArray(argv.stage)) {
        stage = argv.stage.split(',')
    }

    if (!TRACK_SUITE_URL) {
        console.log('[run_tests.js] TRACK_SUITE_URL env not specified. No logs will be uploaded');
    }
    const finalTestFiles = getTestFiles().sort((a, b) => a.localeCompare(b));

    if (!finalTestFiles.length) {
        console.log('[run_tests.js] nothing to test!');
        return;
    }

    console.log('[run_tests.js] test files after all filters:')
    console.log(finalTestFiles);

    let totalRetries = 0;
    let failedTests = 0;

    let log = {
        jobUrl: CI_JOB_URL,
        branch: CI_COMMIT_BRANCH,
        stage,
        records: {}
    };

    for (let i = 0; i < finalTestFiles.length; i++) {
        const testFile = finalTestFiles[i];
        const retries = Number(grepForValue('@retries', testFile));

        const spec = __dirname + testFile.substr(testFile.lastIndexOf('/tests'));
        const testFileName = testFile.substr(testFile.lastIndexOf('/') + 1).replace('.test.ts', '');

        let testRunNumber = 0;

        const allowedRuns = !isNaN(retries) ? retries + 1 : 1;
        
        console.log(`[run_tests.js] testing ${testFile}`);
        console.log(`[run_tests.js] allowed to run ${allowedRuns} times`);

        while(testRunNumber < allowedRuns) {
            testRunNumber++;

            const {totalFailed, ...result } = await cypress.run({
                browser: BROWSER,
                // headless,
                headed: true,
                spec,
                config: {
                    baseUrl: CYPRESS_baseUrl,
                    supportFile: `${__dirname}/support/index.ts`,
                    pluginsFile: `${__dirname}/plugins/index.js`,
                    defaultCommandTimeout: 60000,
                    screenshotsFolder: `${__dirname}/screenshots`,
                    integrationFolder: `${__dirname}/tests`,
                    videosFolder: `${__dirname}/videos`,
                    video: true,
                    chromeWebSecurity: false,
                    trashAssetsBeforeRuns: false,
                },
                configFile: false,
            });

            console.log('result', result);
            // console.log('result.runs[0]', result.runs[0]);
            
            if (totalFailed === 0) {
                log.records[testFileName] = testRunNumber === 1 ? 'success': 'retried';
                break;
            }

            // record failed tests if it is last run
            if (testRunNumber === allowedRuns) {
                failedTests += totalFailed;
                log.records[testFileName] = 'failed';
            }

            totalRetries++;
            console.log(`[run_tests.js] failed in run number ${testRunNumber} of ${allowedRuns}`);
            
        }
    }

    if (TRACK_SUITE_URL) {
        console.log(`[run_tests.js] uploading log: ${JSON.stringify(log, null, 2)}`);
        const response = await fetch(`${TRACK_SUITE_URL}/api/test-records`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(log),
        })
        console.log(`[run_tests.js] response.status: ${response.status}`);
    } 
    
    console.log(`[run_tests.js] retry ratio: ${((totalRetries / finalTestFiles.length) * 100).toFixed(2)}% `)

    process.exit(failedTests);
}

runTests();
