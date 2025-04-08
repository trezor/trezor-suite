import { createTestAnnotation } from '../../../support/annotations';
import { TestCategory, TestPriority } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';

test.describe.skip('Wallet loading', { tag: ['@group=manual'] }, () => {
    test(
        'Default wallet loading behavior',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can change the default wallet loading behavior in the Suite.',
                prerequisites: [
                    'Seeded Trezor device with transactions (eg. with "all" seed"',
                    'Connected Trezor Suite',
                ],
                steps: [
                    'Navigate to "Settings/Device"',
                    'In "Wallet loading" section switch default wallet loading',
                    'Reconnect device',
                    'Observe that wallet loading matches switch',
                ],
                category: TestCategory.Settings,
                priority: TestPriority.Medium,
            }),
        },
        async () => {},
    );
});
