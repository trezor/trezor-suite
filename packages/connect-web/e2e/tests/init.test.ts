import { test, expect } from '@playwright/test';

test.beforeAll(async () => {});

const inlineScriptUrl = process.env.URL
    ? // url of build from CI
      `${process.env.URL}/trezor-connect.js`
    : // for testing out on localhost
      'https://connect.trezor.io/9/trezor-connect.js';

const fixtures = [
    {
        params: {
            connectSrc: '',
        },
        result: 'https://connect.trezor.io/9/iframe.html',
    },
    {
        params: {
            connectSrc: 'https://connect.trezor.io/9.0.1/',
        },
        result: 'https://connect.trezor.io/9.0.1/iframe.html',
    },
    {
        // it is even possible to load old connect version 8
        params: {
            connectSrc: 'https://connect.trezor.io/8/',
        },
        result: 'https://connect.trezor.io/8/iframe.html',
    },
];

fixtures.forEach(f => {
    test(`TrezorConnect.init ${JSON.stringify(f.params)} => ${f.result}`, async ({ page }) => {
        await page.addScriptTag({ url: inlineScriptUrl });
        await page.addScriptTag({
            content: `
                window.TrezorConnect.init({
                    lazyLoad: false,
                    manifest: {
                        email: 'developer@xyz.com',
                        appUrl: 'http://your.application.com',
                    },
                    connectSrc: '${f.params.connectSrc}'
                });
        `,
        });
        const iframeSrc = await page.locator('iframe').getAttribute('src');
        expect(iframeSrc).toContain(f.result);
    });
});
