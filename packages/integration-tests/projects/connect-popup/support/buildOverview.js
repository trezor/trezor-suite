const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = './projects/connect-popup/screenshots';

const CI_JOB_URL = process.env.CI_JOB_URL || '.';

const buildOverview = ({ emuScreenshots }) => {
    if (fs.existsSync('connect-popup-overview.html')) {
        fs.rmSync('connect-popup-overview.html');
    }

    const renderEmuScreenshot = screenshotPath => {
        if (emuScreenshots[screenshotPath]) {
            return `<img src="data:image/png;base64, ${emuScreenshots[screenshotPath]}" />`;
        }
        // not found, this is expected, not all screens on host have device interaction
        return '<div>no device interaction</div>';
    };

    let html = '';
    let index = '';

    const connectExplorerUrls = fs.readdirSync(SCREENSHOTS_DIR);

    connectExplorerUrls.forEach(url => {
        const methodName = url.split('-')[0]; // lets assume it looks like getPublicKey-multiple
        const urlPath = path.join(SCREENSHOTS_DIR, url);
        const screenshots = fs.readdirSync(urlPath);
        index += `<li><a href="#${url}">${url}</a></li>`;
        html += `
            <div id="${url}">
                <h1>${url}</h1>
                <div>
                    <a href="https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/${methodName}.md">documentation</a>
                    |
                    <a href="${process.env.URL}#/method/${url}">explorer</a>
                </div>
            </div>
        `;
        screenshots.forEach(screenshot => {
            const screenshotPath = `${CI_JOB_URL}/${urlPath}/${screenshot}`;
            html += `
                <div>
                    <div>${methodName}/${screenshot}</div>
                    <img src="${screenshotPath.replace(
                        '/projects/connect-popup',
                        '/artifacts/raw/packages/integration-tests/projects/connect-popup',
                    )}" />
                    ${renderEmuScreenshot(`./${urlPath}/${screenshot}`)}
                </div>
            `;
        });
    });

    fs.appendFileSync(
        'connect-popup-overview.html',
        `
        <html>
            <head>
                <title>Connect popup</title>
            </head>
            <body>
                <div>${process.env.CI_JOB_NAME} job in ${process.env.CI_COMMIT_BRANCH} branch</div>
                <ul>${index}</ul>
                ${html}
            </body>
        </html>
    `,
    );
};

module.exports = buildOverview;
