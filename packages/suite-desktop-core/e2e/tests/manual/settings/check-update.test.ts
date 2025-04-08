import { formatTestSteps } from '../../../support/annotations';
import {
    TestAnnotationType,
    TestCategory,
    TestPriority,
} from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';

test.describe.skip('Check for update', { tag: ['@group=manual'] }, () => {
    test(
        'Check for updates modal',
        {
            annotation: [
                {
                    type: TestAnnotationType.TestCase,
                    description: 'Verifies that a user can check for updates in the Trezor Suite.',
                },
                {
                    type: TestAnnotationType.Prerequisites,
                    description: formatTestSteps([
                        'BTC only firmware on Trezor device',
                        'Connected Trezor Suite',
                    ]),
                },
                {
                    type: TestAnnotationType.Steps,
                    description: formatTestSteps([
                        'Go to "Settings/Application"',
                        'In "Suite version" click on Check for updates',
                        'Check for updates modal appears',
                    ]),
                },
                {
                    type: TestAnnotationType.Category,
                    description: TestCategory.Settings,
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
