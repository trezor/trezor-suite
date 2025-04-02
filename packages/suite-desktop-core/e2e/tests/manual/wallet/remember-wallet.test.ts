import { TestAnnotationType, TestCategory, TestPriority } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Wallet remembering', { tag: ['@group=manual'] }, () => {
    test(
        'Wallet remembering',
        {
            annotation: [
                {
                    type: TestAnnotationType.TestCase,
                    description:
                        'Verifies that a user can remember a wallet and load it on another device.',
                },
                {
                    type: TestAnnotationType.Prerequisites,
                    description: formatTestSteps([
                        'Two seeded and connected Trezor devices',
                        'Trezor Suite with standard wallet connected for each Trezor',
                    ]),
                },
                {
                    type: TestAnnotationType.Steps,
                    description: formatTestSteps([
                        'Connect device A',
                        'Click on "Standard wallet"',
                        'Wait for discovery to finish',
                        'In wallet overview, click on "remember wallet" switch',
                        'Disconnect device A',
                        'The remembered wallet stays visible',
                        'Connect device B',
                        'Load the remembered wallet from device A',
                        'Navigate to the "device settings"',
                        'Everything should be inactive',
                        'There should be a notification at the top asking the user to connect the device to change settings',
                    ]),
                },
                {
                    type: TestAnnotationType.Category,
                    description: TestCategory.Wallets,
                },
                {
                    type: TestAnnotationType.Priority,
                    description: TestPriority.High,
                },
                {
                    type: TestAnnotationType.Stream,
                    description: 'TODO',
                },
            ],
        },
        async () => {},
    );
});
