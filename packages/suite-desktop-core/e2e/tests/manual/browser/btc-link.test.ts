import { TestAnnotationType, TestCategory, TestPriority, TestStream } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Bitcoin link', { tag: ['@group=manual'] }, () => {
    test(
        'Open a bitcoin link',
        {
            annotation: [
                {
                    type: TestAnnotationType.TestCase,
                    description:
                        'Verifies that a user can open a bitcoin link in a supported browser and autofill the recipient address when sending BTC.',
                },
                {
                    type: TestAnnotationType.Prerequisites,
                    description: formatTestSteps([
                        'Bitcoin address (like bitcoin:bc1qf8cedqguh2ucc3fgsphmgt789q9szh35vtl38m)',
                        'Seeded Trezor device',
                        'Connected Trezor Suite',
                    ]),
                },
                {
                    type: TestAnnotationType.Steps,
                    description: formatTestSteps([
                        'Put the BTC url in a supported browser',
                        'Click on "Open Trezor Suite"',
                        'A notification "Get to an account to send" appears in the top right corner of Suite',
                        'Click on "Accounts"',
                        'Select a BTC account if it’s not selected',
                        'Click on "Send"',
                        'A button "Autofil send form" should appear in the notification',
                        'Click on the "Autofil" button',
                        'BTC address from test data should appear in the "Address" part of the send form',
                    ]),
                },
                {
                    type: TestAnnotationType.Category,
                    description: TestCategory.UriLinkHandler,
                },
                {
                    type: TestAnnotationType.Priority,
                    description: TestPriority.Medium,
                },
                {
                    type: TestAnnotationType.Stream,
                    description: TestStream.Foundation,
                },
            ],
        },
        async () => {},
    );
});
