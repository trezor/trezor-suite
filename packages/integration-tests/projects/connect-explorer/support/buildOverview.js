const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = './projects/connect-explorer/screenshots';

const CI_JOB_URL = process.env.CI_JOB_URL || '.';

const buildOverview = () => {
    if (fs.existsSync('connect-popup-overview.html')) {
        fs.rmSync('connect-popup-overview.html');
    }

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
                    <a href="https://github.com/trezor/connect/blob/develop/docs/methods/${methodName}.md">documentation</a>
                    |
                    <a href="${process.env.URL}#/method/${url}">explorer</a>
                </div>
            </div>
        `;
        screenshots.forEach(screenshot => {
            const screenshotPath = `${CI_JOB_URL}/${urlPath}/${screenshot}`;
            html += `
                <div>
                    <div>${screenshot}</div>
                    <img src="${screenshotPath.replace(
                        '/projects/connect-explorer',
                        '/artifacts/raw/packages/integration-tests/projects/connect-explorer',
                    )}" />
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
                <ul>${index}</ul>
                ${html}
            </body>
        </html>
    `,
    );
};

module.exports = buildOverview;
