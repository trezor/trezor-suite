import { TestCategory, TestPriority } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Web usb transport', { tag: ['@group=manual'] }, () => {
    test(
        'Suite web version webUSB transport',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can connect and unlock a device via webUSB transport.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'Access to Staging version of Trezor Suite',
                    'Trezor Bridge or Trezor Suite desktop app not running',
                ],
                steps: [
                    'Start Google chrome browser',
                    'Clear USB permissions in settings',
                    'Navigate to Settings - Privacy and Security - Site Settings - Additional permissions',
                    'Open USB devices',
                    'Delete TREZOR records',
                    'Navigate to https://staging-suite.trezor.io/web/ and connect and unlock device',
                    'Connect device via webUSB dialogue',
                    'Perform discovery and generate receive address',
                ],
                category: TestCategory.Wallets,
                priority: TestPriority.Critical,
            }),
        },
        async () => {},
    );
});
