import { test, expect } from '@playwright/test';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

test.beforeAll(async () => {});

const inlineScriptUrl = process.env.URL
    ? // url of build from CI
      `${process.env.URL}/trezor-connect.js`
    : // for testing out on localhost
      'https://connect.trezor.io/9/trezor-connect.js';

const fixtures = [
    {
        params: {
            connectSrc: 'http://localhost:8088/',
        },
        result: 'http://localhost:8088/iframe.html',
    },
    // {
    //     params: {
    //         connectSrc: '',
    //     },
    //     result: 'https://connect.trezor.io/9/iframe.html',
    // },
    // {
    //     params: {
    //         versionChannel: undefined,
    //         connectSrc: 'https://connect.trezor.io/9.0.1/',
    //     },
    //     result: 'https://connect.trezor.io/9.0.1/iframe.html',
    // },
    // {
    //     // it is even possible to load old connect version 8
    //     params: {
    //         connectSrc: 'https://connect.trezor.io/8/',
    //     },
    //     result: 'https://connect.trezor.io/8/iframe.html',
    // },
];

fixtures.forEach(f => {
    test(`TrezorConnect.init ${JSON.stringify(f.params)} => ${f.result}`, async ({ page }) => {
        await TrezorUserEnvLink.connect();

        // await page.addScriptTag({ url: inlineScriptUrl });
        // await page.addScriptTag({
        //     content: `
        //         window.TrezorConnect.init({
        //             lazyLoad: false,
        //             manifest: {
        //                 email: 'developer@xyz.com',
        //                 appUrl: 'http://your.application.com',
        //             },
        //             connectSrc: '${f.params.connectSrc}',
        //             lazyLoad: false,
        //         });
        //         // setTimeout(() => {
        //         //     const timeout = 200;

        //         //     window.TrezorConnect.getAddress({
        //         //         // showOnTrezor: true,
        //         //         path: "m/49'/0'/0'/0/0",
        //         //         coin: 'btc',
        //         //     }).then(res => {
        //         //         console.info('->', res);
        //         //         document.getElementById('result').innerText = JSON.stringify(res);
        //         //     });
        //         //     if (timeout) {
        //         //         setTimeout(() => {
        //         //             window.TrezorConnect.getAddress({
        //         //                 showOnTrezor: true,
        //         //                 path: "m/49'/0'/0'/0/0",
        //         //                 override: true,
        //         //             }).then(res => {
        //         //                 console.info('->', res);
        //         //                 document.getElementById('result').innerText = JSON.stringify(res);
        //         //             });
        //         //         }, timeout);
        //         //     }
        //         // }, 1000)

        // `,
        // });
        await page.goto('http://localhost:8080');
        // await page.getByRole('button', { name: 'Override 0' }).click();
        await page.getByRole('button', { name: 'Override 0' }).click();
        await page.waitForSelector('text=ButtonRequest_Address');
        await TrezorUserEnvLink.api.pressYes();
        // const iframeSrc = await page.locator('iframe').getAttribute('src');
        // expect(iframeSrc).toContain(f.result);
        await page.pause();
    });
});
