import { devices } from '@playwright/test';

import { TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

const iosAria = `
    - heading "Trezor Suite web doesn’t support iOS" [level=1]
    - paragraph: "Trezor Safe 7 can connect via Bluetooth using the Trezor Suite desktop app. Trezor Suite is also available on:"
    - list:
      - listitem: Trezor Suite desktop app
      - listitem: Trezor Suite for web
      - listitem: Mobile web app for Chrome on Android
`;

test.use({ startEmulator: false, browserName: 'chromium', ...devices['iPhone 15 Pro'] });

test.describe('iPhone with Chrome browser', { tag: ['@webOnly', '@noDevice'] }, () => {
    test(
        'Suite does not support iOS',
        { annotation: createTestAnnotation({ stream: TestStream.Growth }) },
        async ({ page }) => {
            await expect(
                page.getByRole('heading', { name: 'Trezor Suite web doesn’t support iOS' }),
            ).toBeVisible();
            await expect(page.locator('body')).toMatchAriaSnapshot(iosAria);
            await expect(page.getByText('Continue at my own risk')).toBeHidden();
        },
    );
});
