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

        fs.writeFile('results.json', jsonReport, err => {
            if (err) {
                console.log(err);
                return;
            }
            console.log('Successfully Written to File: results.json');
        });
        const json = await JSON.parse(jsonReport);
        const performance = json.categories.performance.score;
        console.log('performance: ', performance);
        if (performance < 0.5) {
            throw new Error('min performance score not met');
        }
    } catch (error) {
        console.log(error);
        throw new Error(error);
    } finally {
        await chrome.kill();
    }
};

const urlToTest = 'https://suite.corp.sldev.cz/suite-web/develop';

run(urlToTest, {
    chromeFlags: [
        '--ignore-certificate-errors',
        '--no-sandbox',
        '--ignore-urlfetcher-cert-requests',
        '--allow-insecure-localhost',
        '--view',
    ],
});
