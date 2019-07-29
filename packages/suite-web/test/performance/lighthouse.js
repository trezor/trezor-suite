/* eslint-disable @typescript-eslint/no-var-requires */
const lighthouse = require('lighthouse/lighthouse-core');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const ReportGenerator = require('lighthouse/lighthouse-core/report/report-generator');

const run = async (url, options) => {
    let chrome;
    try {
        console.log('debug 0');
        chrome = await chromeLauncher.launch({ chromeFlags: options.chromeFlags });
        options.port = chrome.port;
        console.log('debug 00');

        const results = await lighthouse(url, options);
        const jsonReport = ReportGenerator.generateReport(results.lhr, 'json');
        const htmlReport = ReportGenerator.generateReport(results.lhr, 'html');

        console.log('debug 1');
        await fs.writeFileSync('test/performance/results.json', jsonReport);
        await fs.writeFileSync('test/performance/results.html', htmlReport);
        console.log('debug 2');

        const json = await JSON.parse(jsonReport);
        const performance = json.categories.performance.score;
        console.log('performance: ', performance);
        // if (performance < 0.5) {
        // throw new Error('min performance score not met');
        // }
    } catch (error) {
        console.log(error);
        process.exit(1);
    } finally {
        await chrome.kill();
        process.exit(0);
    }
};

const urlToTest = process.env.TEST_URL;
console.log('urlToTest', urlToTest);

run(urlToTest, {
    chromeFlags: [
        '--ignore-certificate-errors',
        '--ignore-urlfetcher-cert-requests',
        '--allow-insecure-localhost',
    ],
});
