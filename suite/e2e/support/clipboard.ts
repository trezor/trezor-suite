import { type Page, expect } from '@playwright/test';

import { step } from './common';

export class ClipboardFixture {
    constructor(private readonly page: Page) {}

    @step()
    read() {
        return this.page.evaluate(() => navigator.clipboard.readText());
    }

    @step()
    async expectText(expected: string) {
        await expect.poll(() => this.read()).toBe(expected);
    }

    // The clipboard is shared beyond the test (browser process on web, X server on desktop),
    // so clear it to protect tests from values left behind by a previous test.
    @step()
    async clear() {
        await this.page.evaluate(() => navigator.clipboard.writeText(''));
    }
}
