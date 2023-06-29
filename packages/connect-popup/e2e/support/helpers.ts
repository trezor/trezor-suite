/* eslint-disable no-await-in-loop */

import { Page } from '@playwright/test';

// Waits and clicks for an array on buttons in serial order.
export const waitAndClick = async (page: Page, buttons: string[]) => {
    // eslint-disable-next-line no-restricted-syntax
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
