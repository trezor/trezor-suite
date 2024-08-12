import path from 'path';
import { BrowserContext, chromium, Page } from '@playwright/test';

// Waits and clicks for an array on buttons in serial order.
export const waitAndClick = async (page: Page, buttons: string[]) => {
    for (const button of buttons) {
        await page.waitForSelector(`[data-testid='${button}']`, { state: 'visible' });
        await page.click(`[data-testid='${button}']`);
    }
};

// Helper to use data-test attributes to find elements.
export const findElementByDataTest = async (page: Page, dataTestId: string, timeout?: number) => {
    await page.waitForSelector(`[data-testid='${dataTestId}']`, { state: 'visible', timeout });

    return page.$(`[data-testid='${dataTestId}']`);
};

export const log = (...val: string[]) => {
    console.log(`[===]`, ...val);
};

// Next.js uses client side routing, so we use this to navigate without reloading the page
export const nextJsGoto = async (page: Page, url: string) => {
    await page.evaluate(url => {
        (window as any).router.push(url);
    }, url);
};

export const formatUrl = (baseUrl: string, path: string) => {
    const [baseUrlWithoutParams, params] = baseUrl.split('?');
    const [pathWithoutParams, pathParams] = path.split('?');

    return `${baseUrlWithoutParams}${pathWithoutParams}?${params ? `${params}&` : ''}${pathParams ?? ''}`;
};

const getExtensionPage = async () => {
    const pathToExtension = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'connect-explorer',
        'build-webextension',
    );

    const userDataDir = `/tmp/test-user-data-dir/${new Date().getTime()}`;
    const browserContext = await chromium.launchPersistentContext(userDataDir, {
        // https://playwright.dev/docs/chrome-extensions#headless-mode
        // By default, Chrome's headless mode in Playwright does not support Chrome extensions.
        // To overcome this limitation, you can run Chrome's persistent context with a new headless mode.
        // using `--headless=new`
        headless: false,
        args: [
            process.env.HEADLESS === 'true' ? `--headless=new` : '', // the new headless arg for chrome v109+. Use '--headless=chrome' as arg for browsers v94-108.
            `--disable-extensions-except=${pathToExtension}`,
            `--load-extension=${pathToExtension}`,
        ],
    });

    await browserContext.clearCookies();
    await browserContext.clearPermissions();

    const page = await browserContext.newPage();

    // https://playwright.dev/docs/chrome-extensions#testing
    // It looks like the only way to get extension ID from a MV3 web extension in playwright is having serviceworker loaded.
    let [background] = browserContext.serviceWorkers();
    if (!background) background = await browserContext.waitForEvent('serviceworker');

    // https://github.com/microsoft/playwright/issues/5593#issuecomment-949813218
    await page.goto('chrome://inspect/#extensions');

    const extensionId = background.url().split('/')[2];

    const url = `chrome-extension://${extensionId}/`;

    return {
        page,
        url,
        browserContext,
    };
};

// This functions is a wrapper that provides connect-explorer page depending on
// env, webextension or browser.
export const getContexts = async (
    originalPage: Page,
    originalUrl: string,
    isWebExtension: boolean,
) => {
    if (!isWebExtension) {
        return {
            explorerUrl: originalUrl,
            explorerPage: originalPage,
        };
    }
    const { page, url, browserContext } = await getExtensionPage();

    return {
        explorerPage: page,
        explorerUrl: url,
        browserContext,
    };
};

export const openPopup = (
    browserContext: BrowserContext | undefined,
    explorerPage: Page,
    isWebExtension: boolean,
): Promise<Page[]> => {
    const triggerPopup = [];

    if (isWebExtension && browserContext) {
        triggerPopup.push(browserContext.waitForEvent('page'));
    } else {
        triggerPopup.push(explorerPage.waitForEvent('popup'));
    }
    triggerPopup.push(explorerPage.click("div[data-testid='@api-playground/collapsible-box']"));
    triggerPopup.push(explorerPage.click("button[data-testid='@submit-button']"));
    triggerPopup.push(explorerPage.waitForSelector("[data-testid='@submit-button/spinner']"));

    return Promise.all(triggerPopup) as Promise<Page[]>;
};

export const checkHasLogs = async (logPage: Page) => {
    const locator = await logPage.locator("button[data-testid='@log-container/download-button']");
    if (await locator.isVisible()) {
        return true;
    }

    return false;
};

export const downloadLogs = async (logPage: Page, downloadLogPath: string) => {
    const [download] = await Promise.all([
        logPage.waitForEvent('download'), // wait for download to start
        logPage.click("button[data-testid='@log-container/download-button']"),
    ]);

    await download.saveAs(downloadLogPath);

    return download;
};

export const setConnectSettings = async (
    explorerPage: Page,
    explorerUrl: string,
    { trustedHost = false, connectSrc }: { trustedHost?: boolean; connectSrc?: string },
    _isWebExtension?: boolean,
) => {
    await explorerPage.goto(formatUrl(explorerUrl, `settings/index.html`));
    /*if (isWebExtension) {
        // When webextension and using service-worker we need to wait for handshake is confirmed with proxy.
        await explorerPage.waitForSelector("div[data-testid='@settings/handshake-confirmed']");
    }*/
    if (trustedHost) {
        await waitAndClick(explorerPage, ['@checkbox/trustedHost']);
    }
    if (connectSrc) {
        (await explorerPage.waitForSelector("input[data-testid='@input/connectSrc']")).fill(
            connectSrc,
        );
    }
    if (process.env.CORE_IN_POPUP) {
        await waitAndClick(explorerPage, ['@select/coreMode/input']);
        await waitAndClick(explorerPage, ['@select/coreMode/option/popup']);
    }
    await waitAndClick(explorerPage, ['@submit-button']);
};

export const waitForPopup = (
    browserContext: BrowserContext | undefined,
    explorerPage: Page,
    isWebExtension: boolean,
): Promise<Page[]> => {
    const triggerPopup = [];

    if (isWebExtension && browserContext) {
        triggerPopup.push(browserContext.waitForEvent('page'));
    } else {
        triggerPopup.push(explorerPage.waitForEvent('popup'));
    }

    return Promise.all(triggerPopup) as Promise<Page[]>;
};
