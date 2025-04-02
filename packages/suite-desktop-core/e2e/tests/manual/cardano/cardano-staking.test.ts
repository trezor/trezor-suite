import { TestAnnotationType, TestCategory, TestPriority, TestStream } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Cardano staking', { tag: ['@group=manual'] }, () => {
    test(
        'Cardano staking',
        {
            annotation: [
                {
                    type: TestAnnotationType.TestCase,
                    description:
                        'Verifies that a user can delegate funds or withdraw staking rewards on the Cardano network.',
                },
                {
                    type: TestAnnotationType.Prerequisites,
                    description: formatTestSteps([
                        'Seeded Trezor device',
                        'Trezor Suite app with a funded wallet connected',
                    ]),
                },
                {
                    type: TestAnnotationType.Steps,
                    description: formatTestSteps([
                        'Navigate to the "Accounts"',
                        'Select or enable and then Select "Cardano"',
                        'Select account with funds present',
                        'Navigate to "Staking" tab',
                        'Delegate funds or withdraw staking rewards',
                        'Success notification is rendered in Trezor Suite',
                    ]),
                },
                {
                    type: TestAnnotationType.Category,
                    description: TestCategory.ADA,
                },
                {
                    type: TestAnnotationType.Priority,
                    description: TestPriority.High,
                },
                {
                    type: TestAnnotationType.Stream,
                    description: TestStream.Trends,
                },
            ],
        },
        async () => {},
    );
});
