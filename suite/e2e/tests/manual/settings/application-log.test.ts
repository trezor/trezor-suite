import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Application log', { tag: ['@group=manual'] }, () => {
    test(
        'Application log modal in settings',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can open the application log modal in the Suite settings.',
                prerequisites: [
                    'Seeded Trezor device with a labelled account',
                    'Connected Trezor Suite',
                ],
                steps: [
                    'Navigate to "Settings"',
                    'Go to "Application settings"',
                    'In the "Application log" section click on "Show log"',
                    'Application log modal should open',
                    'Confirm the log can be copied and exported',
                    'Confirm the log contains no confidential data - no device label or id, no account labels, no xpub, no addresses and no exact balances',
                ],
                category: TestCategory.Settings,
                priority: TestPriority.Medium,
                stream: TestStream.Growth,
            }),
        },
        async () => {},
    );
});
