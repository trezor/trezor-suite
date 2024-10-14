import { test, expect, firefox, chromium, Page, BrowserContext } from '@playwright/test';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { waitAndClick, log, formatUrl } from '../support/helpers';
import http from 'http';
import https from 'https';

const url = process.env.URL || 'http://localhost:8088/';

// different origin URL for testing cross-origin requests
const proxyPort = 5088;
const proxyUrl = `http://localhost:${proxyPort}/`;

const handleSimulatedCrossOrigin = () => {
    // HTTP proxy server that stands in front of the actual server
    const server = http.createServer((request, response) => {
        if (!request.url) return;
        const oldUrl = new URL(request.url, proxyUrl).toString();
        const newUrl = oldUrl.replace(proxyUrl, url);
        // make a new request to the actual server
        const proxy = (newUrl.startsWith('http://') ? http : https).request(newUrl, {
            method: request.method,
            headers: {
                ...request.headers,
                // rewrite host header to match
                host: new URL(newUrl).host,
            },
        });
        request.pipe(proxy);
        proxy.on('response', proxyResponse => {
            response.writeHead(proxyResponse.statusCode || 500, proxyResponse.headers);
            proxyResponse.pipe(response);
        });
    });
    server.unref();
    server.on('error', e => {
        console.error('HTTP proxy error', e);
    });
    server.listen(proxyPort, () => {
        console.log(`HTTP proxy listening on port ${proxyPort}`);
    });

    return () => new Promise(resolve => server.close(resolve));
};

let page: Page;
let popup: Page;

test.beforeAll(async () => {
    await TrezorUserEnvLink.connect();
    await TrezorUserEnvLink.stopBridge();
    await TrezorUserEnvLink.stopEmu();
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
        queryString: `?trezor-connect-src=${proxyUrl}&core-mode=iframe`,
        setup: handleSimulatedCrossOrigin,
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
        queryString: `?trezor-connect-src=${proxyUrl}&core-mode=auto`,
        setup: handleSimulatedCrossOrigin,
        expect: async () => {
            await expect(popup.getByText('Connect Trezor to continue').first()).toBeVisible({
                timeout: 300000,
            });
            await expect(page.locator('iframe')).not.toBeAttached();
        },
    },
    {
        browser: chromium,
        description: `iframe blocked -> fallback to popup`,
        queryString: '?core-mode=auto',
        setup: (context: BrowserContext) => {
            context.route('**/*', route => {
                // block iframe
                if (route.request().url().includes('iframe.html')) {
                    return route.abort();
                }
                route.continue();
            });

            return () => {};
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

        const afterCleanup = await f.setup?.(context);

        const formattedUrl = formatUrl(url, `methods/bitcoin/verifyMessage/${f.queryString}`);
        log(`going to: ${formattedUrl}`);
        await page.goto(formattedUrl);
        log('waiting for explorer to load');
        await waitAndClick(page, ['@api-playground/collapsible-box']);
        await page.waitForSelector("button[data-testid='@submit-button']", {
            state: 'visible',
        });

        log('opening popup');
        [popup] = await Promise.all([
            context.waitForEvent('page'),
            page.locator("button[data-testid='@submit-button']").click({ timeout: 30000 }),
            page.waitForSelector("[data-testid='@submit-button/spinner']"),
        ]);
        log('waiting for analytics');
        await waitAndClick(popup, ['@analytics/continue-button']);
        log('testing expect');
        await f.expect();
        await browserInstance.close();

        await afterCleanup?.();
    });
});
