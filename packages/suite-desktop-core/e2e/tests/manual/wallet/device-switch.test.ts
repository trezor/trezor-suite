import { TestAnnotation } from '../../../support/enums/testAnnotation';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Device switch', { tag: ['@group=manual'] }, () => {
    test(
        'Device switch',
        {
            annotation: [
                {
                    type: TestAnnotation.TestCase,
                    description:
                        'Verifies that a user can switch between wallets on different Trezor devices.',
                },
                {
                    type: TestAnnotation.Prerequisites,
                    description: formatTestSteps([
                        'Two seeded and connected Trezor devices',
                        'Trezor Suite with standard wallet connected for each Trezor',
                    ]),
                },
                {
                    type: TestAnnotation.Steps,
                    description: formatTestSteps([
                        'Open the app',
                        'Click on Device selector overview in the top left corner',
                        'A wallet from first Trezor should be connected',
                        'Click on standard wallet from second Trezor',
                        'Accounts should correctly switch',
                    ]),
                },
            ],
        },
        async () => {},
    );
});
