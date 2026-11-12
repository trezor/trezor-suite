import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Find on page', { tag: ['@group=manual'] }, () => {
    test(
        'Find text on page with the find bar',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies the desktop find bar (Cmd/Ctrl+F): highlighting matches, match counter, navigation between matches and closing.',
                prerequisites: [
                    'Trezor Suite desktop app - the find bar is not available on web, where the native browser find is used',
                    'Seeded Trezor device',
                    'Connected Trezor Suite with a loaded account that has transactions',
                ],
                steps: [
                    'Navigate to an account with a transaction history',
                    'Press Cmd+F (macOS) or Ctrl+F (Windows/Linux) and confirm the find bar opens with the input focused',
                    'Type a text present multiple times on the page and confirm all matches are highlighted and the counter shows "1/N"',
                    'Press Enter, Cmd/Ctrl+G and the "Next" button and confirm the active match moves forward and the page scrolls to it',
                    'Press Shift+Cmd/Ctrl+G and the "Previous" button and confirm the active match moves backward',
                    'Type a text that is not on the page and confirm "Not found" is shown',
                    'Navigate to another page with the find bar open and confirm the matches and counter update',
                    'Press Escape and confirm the find bar closes and all highlights are removed',
                    'Reopen the find bar and close it with the close button, confirm all highlights are removed',
                ],
                category: TestCategory.Application,
                priority: TestPriority.Medium,
                stream: TestStream.Growth,
            }),
        },
        async () => {},
    );

    test(
        'Send flow with the find bar open',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that Suite does not crash when the send flow is used while the find bar is open (regression for https://github.com/trezor/trezor-suite/issues/34956).',
                prerequisites: [
                    'Trezor Suite desktop app - the find bar is not available on web',
                    'Seeded Trezor device',
                    'Connected Trezor Suite with a funded EVM account holding tokens (eg. USDT)',
                ],
                steps: [
                    'Navigate to the funded account and open the "Send" form for a token',
                    'Fill in a recipient address and an amount',
                    'Press Cmd/Ctrl+F and search for a text visible on the page (eg. the token symbol) so matches are highlighted',
                    'With the find bar open, click "Send" and confirm the signing modal opens without an error screen',
                    'With the find bar still open, close the signing modal (cancel on the device or close the modal) and confirm Suite does not show an error screen',
                    'Repeat the flow, sign the transaction and confirm the success state is shown without an error screen',
                    'Close the find bar and confirm Suite stays usable',
                ],
                category: TestCategory.Application,
                priority: TestPriority.High,
                stream: TestStream.Growth,
            }),
        },
        async () => {},
    );
});
