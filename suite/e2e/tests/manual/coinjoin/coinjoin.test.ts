import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Coinjoin', { tag: ['@group=manual'] }, () => {
    test(
        'Discovery of a coinjoin account',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that discovery finishes correctly for a Coinjoin account added in the Suite.',
                prerequisites: [
                    'Seeded Trezor device with transactions (eg. with "all" seed)',
                    'Connected Trezor Suite',
                    '"btc" network enabled',
                    'Coinjoin available - either enabled remotely or Suite running in debug mode',
                ],
                steps: [
                    'Navigate to "Accounts"',
                    'In the left sidebar, click on the "+" sign next to the "My accounts" header',
                    '"New account" modal should appear',
                    'Select "Bitcoin" from coin selection',
                    'Select "Coinjoin" account type from account selection',
                    'Click on "Add account"',
                    'Discovery of the coinjoin account finishes without an error',
                    'The coinjoin account appears in the accounts sidebar with its balance loaded',
                ],
                category: TestCategory.CoinJoin,
                priority: TestPriority.Low,
                stream: TestStream.Connect,
            }),
        },
        async () => {},
    );
});
