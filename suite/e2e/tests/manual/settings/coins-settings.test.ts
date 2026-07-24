import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Coins settings', { tag: ['@group=manual'] }, () => {
    test(
        'Custom backend',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can set a custom blockchain backend for a coin and that the app connects to it.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'URL of a working custom backend (e.g. a Blockbook instance)',
                ],
                steps: [
                    'Navigate to "Settings" > "Coins"',
                    'Click the settings (gear) icon of an enabled coin (e.g. Bitcoin)',
                    'In the coin settings, open the "Backends" section',
                    'Select custom backend type and enter the custom backend URL',
                    'Confirm the change and wait for reconnection',
                    'Confirm the account of the coin still loads (discovery/sync works via the custom backend)',
                    'Confirm the custom backend icon appears in the sidebar bottom navbar',
                    'Enter an invalid URL and confirm a validation error is shown',
                    'Revert to the default backend and confirm the app reconnects',
                ],
                category: TestCategory.Coins,
                priority: TestPriority.Medium,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );

    test(
        'Custom explorer',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can set a custom block explorer and that transaction/address links use it.',
                prerequisites: ['Seeded Trezor device with transactions', 'Connected Trezor Suite'],
                steps: [
                    'Navigate to "Settings" > "Coins"',
                    'Click the settings (gear) icon of an enabled coin (e.g. Bitcoin)',
                    'In the coin settings, open the "Block explorer" section and enter a custom explorer URL',
                    'Confirm the change',
                    'Navigate to an account of the coin and open a transaction detail',
                    'Click the link to the block explorer',
                    'Confirm the transaction opens in the custom explorer',
                    'Revert to the default explorer and confirm links point to the default explorer again',
                ],
                category: TestCategory.Coins,
                priority: TestPriority.Low,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );
});
