/* eslint-disable @typescript-eslint/no-var-requires */
const lighthouse = require('lighthouse/lighthouse-core');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const ReportGenerator = require('lighthouse/lighthouse-core/report/report-generator');

const run = async (url, options) => {
    const chrome = await chromeLauncher.launch({ chromeFlags: options.chromeFlags });
    options.port = chrome.port;

    try {
        const results = await lighthouse(url, options);
        const jsonReport = ReportGenerator.generateReport(results.lhr, 'json');
        const htmlReport = ReportGenerator.generateReport(results.lhr, 'html');

        await fs.writeFileSync('test/performance/results.json', jsonReport);
        await fs.writeFileSync('test/performance/results.html', htmlReport);

        const json = await JSON.parse(jsonReport);
        const performance = json.categories.performance.score;
        console.log('performance: ', performance);
        // if (performance < 0.5) {
        // throw new Error('min performance score not met');
        // }
    } catch (error) {
        console.log(error);
        throw new Error(error);
    } finally {
        await chrome.kill();
    }
};

const urlToTest = process.env.TEST_URL;
console.log('urlToTest', urlToTest);

try {
    run(urlToTest, {
        chromeFlags: [
            '--ignore-certificate-errors',
            '--no-sandbox',
            '--ignore-urlfetcher-cert-requests',
            '--allow-insecure-localhost',
            '--view',
        ],
    });
} catch (error) {
    consoel.log('error', error);
}

