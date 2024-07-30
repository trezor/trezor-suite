import { test, expect, firefox, chromium, Page, BrowserContext } from '@playwright/test';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { waitAndClick, log, formatUrl } from '../support/helpers';

const url = process.env.URL || 'http://localhost:8088/';

// different origin URL for testing cross-origin requests
const simulatedCrossOrigin = 'https://connect.trezor.io/9/';

const handleSimulatedCrossOrigin = (context: BrowserContext) => {
    context.route('**/*', async route => {
        // proxy request to simulatedCrossOrigin to the real URL
        if (route.request().url().startsWith(simulatedCrossOrigin)) {
            const newUrl = route.request().url().replace(simulatedCrossOrigin, url);

            const request = await fetch(newUrl, {
                method: route.request().method(),
                headers: route.request().headers(),
                body: route.request().postData(),
            });

            const body = await request.text();

            return route.fulfill({
                status: request.status,
                headers: Object.fromEntries(request.headers.entries()),
                body,
            });
        }

        route.continue();
    });
};

let page: Page;
let popup: Page;

test.beforeAll(async () => {
    await TrezorUserEnvLink.connect();
    await TrezorUserEnvLink.api.stopBridge();
    await TrezorUserEnvLink.api.stopEmu();
});

const fixtures = [
    {
        browser: firefox,
        description: `bridge is the only available transport`,
        queryString: '',
        expect: () =>
            expect(
                popup.getByRole('heading', { name: "Browser can't communicate with device" }),
            ).toBeVisible({
                timeout: 30000,
            }),
    },
    {
        browser: chromium,
        description: `iframe and host different origins: iframe mode -> bridge`,
        queryString: `?trezor-connect-src=${simulatedCrossOrigin}&core-mode=iframe`,
        before: handleSimulatedCrossOrigin,
        expect: () =>
            expect(
                popup.getByRole('heading', { name: "Browser can't communicate with device" }),
            ).toBeVisible(),
    },
    {
        browser: chromium,
        description: `iframe and host same origins`,
        queryString: '',
        expect: () =>
            expect(popup.getByText('Connect Trezor to continue').first()).toBeVisible({
                timeout: 10000,
            }),
    },
    {
        browser: chromium,
        description: `iframe and host different origins: auto mode -> popup`,
        queryString: `?trezor-connect-src=${simulatedCrossOrigin}&core-mode=auto`,
        before: handleSimulatedCrossOrigin,
        expect: async () => {
            await expect(popup.getByText('Connect Trezor to continue').first()).toBeVisible({
                timeout: 30000,
            });
            await expect(page.locator('iframe')).not.toBeAttached();
        },
    },
    {
        browser: chromium,
        description: `iframe blocked -> fallback to popup`,
        queryString: '?core-mode=auto',
        before: (context: BrowserContext) => {
            context.route('**/*', route => {
                // block iframe
                if (route.request().url().includes('iframe.html')) {
                    return route.abort();
                }
                route.continue();
            });
        },
        expect: async () => {
            await expect(popup.getByText('Connect Trezor to continue').first()).toBeVisible({
                timeout: 30000,
            });
            await expect(page.locator('iframe')).not.toBeAttached();
        },
    },
];

fixtures.forEach(f => {
    test(`${f.browser.name()}: ${f.description}`, async () => {
        log('start', test.info().title);

        log('launching browser');
        const browserInstance = await f.browser.launch();
        const context = await browserInstance.newContext();
        page = await context.newPage();

        await f.before?.(context);

        log(`going to: ${url}${f.queryString}#/method/verifyMessage`);
        await page.goto(formatUrl(url, `methods/bitcoin/verifyMessage/${f.queryString}`));
        log('waiting for explorer to load');
        await waitAndClick(page, ['@api-playground/collapsible-box']);
        await page.waitForSelector("button[data-test='@submit-button']", {
            state: 'visible',
        });

        log('opening popup');
        [popup] = await Promise.all([
            context.waitForEvent('page'),
            page.locator("button[data-test='@submit-button']").click({ timeout: 30000 }),
        ]);
        log('waiting for analytics');
        await waitAndClick(popup, ['@analytics/continue-button']);
        log('testing expect');
        await f.expect();
        await browserInstance.close();
    });
});
