import { TestAnnotation } from '../../../support/enums/testAnnotation';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Cardano staking', { tag: ['@group=manual'] }, () => {
    test(
        'Cardano staking',
        {
            annotation: [
                {
                    type: TestAnnotation.TestCase,
                    description:
                        'Verifies that a user can delegate funds or withdraw staking rewards on the Cardano network.',
                },
                {
                    type: TestAnnotation.Prerequisites,
                    description: formatTestSteps([
                        'Seeded Trezor device',
                        'Trezor Suite app with a funded wallet connected',
                    ]),
                },
                {
                    type: TestAnnotation.Steps,
                    description: formatTestSteps([
                        'navigate to the "Accounts"',
                        'Select or enable and then Select "Cardano"',
                        'Select account with funds present',
                        'Navigate to "Staking" tab',
                        'Delegate funds or withdraw staking rewards',
                        'Success notification is rendered in Trezor Suite',
                    ]),
                },
            ],
        },
        async () => {},
    );
});
