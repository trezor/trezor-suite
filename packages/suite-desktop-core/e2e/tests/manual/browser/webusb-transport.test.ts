import { formatTestSteps } from '../../../support/annotations';
import {
    TestAnnotationType,
    TestCategory,
    TestPriority,
} from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';

test.describe.skip('Web usb transport', { tag: ['@group=manual'] }, () => {
    test(
        'Suite web version webUSB transport',
        {
            annotation: [
                {
                    type: TestAnnotationType.TestCase,
                    description:
                        'Verifies that a user can connect and unlock a device via webUSB transport.',
                },
                {
                    type: TestAnnotationType.Prerequisites,
                    description: formatTestSteps([
                        'Seeded Trezor device',
                        'Connected Trezor Suite',
                        'Access to Staging version of Trezor Suite',
                        'Trezor Bridge or Trezor Suite desktop app not running',
                    ]),
                },
                {
                    type: TestAnnotationType.Steps,
                    description: formatTestSteps([
                        'Start Google chrome browser',
                        'Clear USB permissions in settings',
                        'Navigate to Settings - Privacy and Security - Site Settings - Additional permissions',
                        'Open USB devices',
                        'Delete TREZOR records',
                        'Navigate to https://staging-suite.trezor.io/web/ and connect and unlock device',
                        'Connect device via webUSB dialogue',
                        'Perform discovery and generate receive address',
                    ]),
                },
                {
                    type: TestAnnotationType.Category,
                    description: TestCategory.Wallets,
                },
                {
                    type: TestAnnotationType.Priority,
                    description: TestPriority.Critical,
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
