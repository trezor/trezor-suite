import { TestCategory, TestPriority } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Device switch', { tag: ['@group=manual'] }, () => {
    test(
        'Device switch',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can switch between wallets on different Trezor devices.',
                prerequisites: [
                    'Two seeded and connected Trezor devices',
                    'Trezor Suite with standard wallet connected for each Trezor',
                ],
                steps: [
                    'Open the app',
                    'Click on Device selector overview in the top left corner',
                    'A wallet from first Trezor should be connected',
                    'Click on standard wallet from second Trezor',
                    'Accounts should correctly switch',
                ],
                category: TestCategory.Wallets,
                priority: TestPriority.Medium,
            }),
        },
        async () => {},
    );
});
