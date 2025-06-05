import { TestCategory, TestOsMatrix, TestPriority } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Mobile browser', { tag: ['@group=manual'] }, () => {
    test(
        'Suite web version mobile browser support',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can connect and use a device via supported mobile browser on Android phone.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Supported mobile browser on Android phone',
                    'Access to Staging version of Trezor Suite',
                ],
                steps: [
                    'Start Google Chrome browser',
                    'Navigate to https://staging-suite.trezor.io/web/ and connect and unlock device',
                    'Connect device via webUSB dialogue',
                    'Perform discovery and generate receive address',
                    'Send a transaction',
                ],
                category: TestCategory.Wallets,
                priority: TestPriority.Critical,
                osMatrix: [TestOsMatrix.Android],
            }),
        },
        async () => {},
    );
});
