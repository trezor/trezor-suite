import { TestCategory, TestOsMatrix, TestPriority } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Auto update', { tag: ['@group=manual'] }, () => {
    test(
        'Perform application auto update',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can update application.',
                prerequisites: [
                    'Current producion version of Trezor Suite',
                    'Release candidate of Trezor Suite',
                    'Build of Trezor Suite that starts with 0x.x.x',
                    'Access to SatoshiLabs VPN',
                    'Codesign builds deployed to autoupdate-test url',
                ],
                steps: [
                    '1. test',
                    'Connect to SatoshiLabs VPN',
                    'Install production version of Trezor Suite application',
                    'Start Trezor Suite application with `--updater-url=https://suite.corp.sldev.cz/autoupdate-test/` flag',
                    'Check that the application is updated to the latest version stat stars with 3x.x.x',
                    '2. test',
                    'Install  version of Trezor Suite application that starts with 0x.x.x',
                    'Update the application to the latest production version',
                    '3. test',
                    'Install release candidate version of Trezor Suite application',
                    'Start Trezor Suite application with `--updater-url=https://suite.corp.sldev.cz/autoupdate-test/` flag',
                    'Check that the application is updated to the latest version stat stars with 3x.x.x',
                ],
                category: TestCategory.Application,
                priority: TestPriority.Critical,
                osMatrix: [
                    TestOsMatrix.Linux,
                    TestOsMatrix.Windows,
                    TestOsMatrix.MacOSArm,
                    TestOsMatrix.MacOSIntel,
                ],
            }),
        },
        async () => {},
    );
});
