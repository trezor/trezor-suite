const puppeteer = require('puppeteer');
const fs = require('fs');
const { Controller } = require('../../websocket-client');

const defaults = {
    // some random empty seed. most of the test don't need any account history so it is better not to slow them down with all all seed
    mnemonic:
        'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
    pin: '',
    passphrase_protection: false,
    label: 'My Trevor',
    needs_backup: false,
};

console.log(process.env);

const url = process.env.URL || 'http://localhost:8082/';

console.log('url', url);

const fixtures = [
    {
        method: 'getPublicKey',
        view: 'export-xpub',
        views: [
            { name: 'export-xpub' }
        ]
    },
    {
        method: 'getPublicKey-multiple',
        views: [
            { name: 'export-xpub' },
        ],
    },
    {
        method: 'getAddress',
        views: [
            { name: 'export-address', confirm: 'host' },
            { name: 'check-address', confirm: 'device' }
        ],
    },
    // todo: forbidden key path at the moment
    // {
    //     method: 'getAddress-multiple',
    //     views: [
    //         { name: 'export-address', confirm: 'host' },
    //     ],
    // },
    {
        method: 'getAccountInfo',
        views: [
            { name: 'export-account-info', confirm: 'host' },
        ],
    },
    {
        method: 'signTransaction-paytoaddress',
        views: [
            { name: 'confirm-output', confirm: 'device' },
            { name: 'follow-device', confirm: 'device' }
        ],

    }
];

const wait = (timeout) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, timeout)
    })

}

const log = (...val) => {
    console.log(`[===]`, ...val);
}

(async () => {
    try {
        const screenshotsDir = './packages/connect-popup/screenshots';
        fs.rmdirSync(screenshotsDir, { recursive: true });
        fs.mkdirSync(screenshotsDir, { recursive: true });

        const controller = new Controller({ url: 'ws://localhost:9001/' });

        await controller.connect();
        await controller.send({ type: 'bridge-start' });
        await controller.send({
            type: 'emulator-start',
            wipe: true,
        });
        await controller.send({
            type: 'emulator-setup',
            ...defaults,
        });
        const browser = await puppeteer.launch({
            // headless: false,
            headless: true,
            args: [
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--disable-setuid-sandbox",
                "--no-sandbox",
            ]
        });

        for (f of fixtures) {
            log(f.method, "start");

            const screenshotsPath = `${screenshotsDir}/${f.method}`;

            if (!fs.existsSync(screenshotsPath)) {
                fs.mkdirSync(screenshotsPath);
            }

            const explorer = await browser.newPage();
            const popupPromise = new Promise(x => explorer.once('popup', x));

            await explorer.goto(`${url}#/method/${f.method}`);

            // screenshot request
            log(f.method, "screenshotting request");
            await explorer.waitForTimeout(2000);
            await explorer.screenshot({ path: `${screenshotsPath}/1-request.png` });

            log(f.method, "submitting in connect explorer");
            await explorer.waitForSelector("button[data-test='@submit-button']", { visible: true });
            await explorer.click("button[data-test='@submit-button']");

            log(f.method, "waiting for popup promise");
            const popup = await popupPromise;
            log(f.method, "popup promise resolved");

            await popup.waitForTimeout(1000);

            try {
                log(f.method, "waiting for confirm pemissions button");
                await popup.waitForSelector("button.confirm", { visible: true, timeout: 5000 });

                await popup.click("button.confirm");
            } catch (err) {
                log(f.method, "pemissions button not found");
                await popup.screenshot({ path: `${screenshotsPath}/err-permissions-not-found.png` });

            }

            for (v of f.views) {
                log(f.method, v.name, "expecting view");

                await popup.waitForSelector(`.${v.name}`, { visible: true });
                await popup.screenshot({ path: `${screenshotsPath}/2-${f.views.findIndex(fv => fv.name === v.name) + 1}-${v.name}.png` });

                if (v.confirm === 'host') {
                    log(f.method, v.name, "user interaction on host");
                    await popup.waitForTimeout(2000);
                    await popup.click("button.confirm");
                }
                if (v.confirm === 'device') {
                    log(f.method, v.name, "user interaction on device");
                    await popup.waitForSelector(`.${v.name}`, { visible: true });
                    await controller.send({ type: 'emulator-press-yes' });
                }

                log(f.method, v.name, "view finished");

            }

            log(f.method, "all views finished");

            await explorer.waitForTimeout(3000);

            // screenshot response
            log(f.method, undefined, "screenshotting response");

            await explorer.screenshot({ path: `${screenshotsPath}/3-response.png` });
            await explorer.waitForTimeout(2000);
            log(f.method, "method finished");

        }

        log("closing browser");

        await browser.close();
        process.exit(0);
    } catch (err) {
        console.log('err', err);
        process.exit(1);
    }

})();

