import { devices } from '@playwright/test';

import { TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.use({ startEmulator: false, ...devices['Desktop Firefox'], channel: 'firefox' });

test.describe('Firefox', { tag: ['@webOnly', '@noDevice'] }, () => {
    test(
        'Suite does support Firefox',
        { annotation: createTestAnnotation({ stream: TestStream.Growth }) },
        async ({ page, onboardingPage }) => {
            await onboardingPage.verifySuiteIsLoaded();
            await expect(page.getByText('Continue at my own risk')).toBeHidden();
        },
    );
});
