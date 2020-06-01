/*
    Heavily inspired by Mattermost, https://github.com/mattermost/mattermost-webapp/blob/master/e2e/run_tests.js good job guys.
*/

const cypress = require('cypress');
const shell = require('shelljs');
const argv = require('yargs').argv;

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
    if (!stage) {
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
    } = process.env;

    const finalTestFiles = getTestFiles().sort((a, b) => a.localeCompare(b));
    let totalRetries = 0;

    if (!finalTestFiles.length) {
        console.log('[run_tests.js] nothing to test!');
        return;
    }

    console.log(finalTestFiles);

    let failedTests = 0;

    for (let i = 0; i < finalTestFiles.length; i++) {
        const testFile = finalTestFiles[i];

        const retries = Number(grepForValue('@retries', testFile));

        const spec = __dirname + testFile.substr(testFile.lastIndexOf('/tests'));
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

            if (totalFailed === 0) {
                break;
            }

            // record failed tests if it is last run
            if (testRunNumber === allowedRuns) {
                failedTests += totalFailed;
            }

            totalRetries++;
            console.log(`[run_tests.js] failed in run number ${testRunNumber} of ${allowedRuns}`)
        }
    }

    console.log(`[run_tests.js] retry ratio: ${((totalRetries / finalTestFiles.length) * 100).toFixed(2)}% `)

    process.exit(failedTests);
}

runTests();
