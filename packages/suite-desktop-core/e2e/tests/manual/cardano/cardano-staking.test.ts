import { TestCategory, TestPriority, TestStream } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Cardano staking', { tag: ['@group=manual'] }, () => {
    test(
        'Cardano staking',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can delegate funds or withdraw staking rewards on the Cardano network.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Trezor Suite app with a funded wallet connected',
                ],
                steps: [
                    'Navigate to the "Accounts"',
                    'Select or enable and then Select "Cardano"',
                    'Select account with funds present',
                    'Navigate to "Staking" tab',
                    'Delegate funds or withdraw staking rewards',
                    'Success notification is rendered in Trezor Suite',
                ],
                category: TestCategory.ADA,
                priority: TestPriority.High,
                stream: TestStream.Trends,
            }),
        },
        async () => {},
    );
});
