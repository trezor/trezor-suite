import { type Page, expect } from '@playwright/test';

type ClipboardCaptureWindow = Window & { __clipboardCapture?: string };

// Deployed Suite (CI and release on sldev.cz) sends Permissions-Policy clipboard-read=().
// Playwright cannot override that, so we capture writeText instead of reading the clipboard.
export const captureClipboardWrites = async (page: Page) => {
    await page.evaluate(() => {
        const { clipboard } = navigator;
        const originalWriteText = clipboard.writeText.bind(clipboard);

        Object.defineProperty(clipboard, 'writeText', {
            configurable: true,
            value: (text: string) => {
                (window as ClipboardCaptureWindow).__clipboardCapture = text;

                return originalWriteText(text).catch(() => undefined);
            },
        });
    });

    return (expected: string) =>
        expect
            .poll(() => page.evaluate(() => (window as ClipboardCaptureWindow).__clipboardCapture))
            .toBe(expected);
};
