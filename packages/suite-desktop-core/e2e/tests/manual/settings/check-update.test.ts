import { TestCategory, TestPriority } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Check for update', { tag: ['@group=manual'] }, () => {
    test(
        'Check for updates modal',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can check for updates in the Trezor Suite.',
                prerequisites: ['BTC only firmware on Trezor device', 'Connected Trezor Suite'],
                steps: [
                    'Go to "Settings/Application"',
                    'In "Suite version" click on Check for updates',
                    'Check for updates modal appears',
                ],
                category: TestCategory.Settings,
                priority: TestPriority.High,
            }),
        },
        async () => {},
    );
});
