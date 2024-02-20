import path from 'path';
import { BrowserContext, chromium, Page } from '@playwright/test';

// Waits and clicks for an array on buttons in serial order.
export const waitAndClick = async (page: Page, buttons: string[]) => {
    for (const button of buttons) {
        await page.waitForSelector(`[data-test='${button}']`, { state: 'visible' });
        await page.click(`[data-test='${button}']`);
    }
};

// Helper to use data-test attributes to find elements.
export const findElementByDataTest = async (page: Page, dataTest: string, timeout?: number) => {
    await page.waitForSelector(`[data-test='${dataTest}']`, { state: 'visible', timeout });

    return page.$(`[data-test='${dataTest}']`);
};

export const log = (...val: string[]) => {
    console.log(`[===]`, ...val);
};

const getExtensionPage = async () => {
    const pathToExtension = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'connect-explorer-webextension',
        'build',
    );

    const initialBrowserContext = await chromium.launchPersistentContext(
        `/tmp/test-user-data-dir/${new Date().getTime()}`,
    );
    await initialBrowserContext.clearPermissions();
    await initialBrowserContext.clearCookies();
    await initialBrowserContext.close();

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

    const url = `chrome-extension://${extensionId}/connect-explorer.html`;

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
            exploreUrl: originalUrl,
            explorerPage: originalPage,
        };
    }
    const { page, url, browserContext } = await getExtensionPage();

    return {
        explorerPage: page,
        exploreUrl: url,
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
    triggerPopup.push(explorerPage.click("button[data-test='@submit-button']"));

    return Promise.all(triggerPopup) as Promise<Page[]>;
};

export const checkHasLogs = async (logPage: Page) => {
    const locator = await logPage.locator("button[data-test='@log-container/download-button']");
    if (await locator.isVisible()) {
        return true;
    }

    return false;
};

export const downloadLogs = async (logPage: Page, downloadLogPath: string) => {
    const [download] = await Promise.all([
        logPage.waitForEvent('download'), // wait for download to start
        logPage.click("button[data-test='@log-container/download-button']"),
    ]);

    await download.saveAs(downloadLogPath);

    return download;
};

export const setTrustedHost = async (explorerPage: Page, explorerUrl: string) => {
    await explorerPage.goto(`${explorerUrl}#/settings`);
    await waitAndClick(explorerPage, ['@checkbox/trustedHost']);
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
