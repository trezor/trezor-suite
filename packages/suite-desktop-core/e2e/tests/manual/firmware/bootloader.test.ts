import { TestAnnotation } from '../../../support/enums/testAnnotation';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Bootloader', { tag: ['@group=manual'] }, () => {
    test(
        'Bootloader update Model One',
        {
            annotation: [
                {
                    type: TestAnnotation.TestCase,
                    description:
                        'Verifies that a user can update the bootloader on the Trezor One device.',
                },
                { 
                    type: TestAnnotation.Prerequisites, 
                    description: formatTestSteps([
                        'Trezor one with BL 1.5.X and older',
                        'Trezor one with BL >1.8.X<1.10.X',
                        'Trezor one with BL >1.10.X',
                        'Connected Trezor Suite',
                    ]), 
                },
                {
                    type: TestAnnotation.Steps,
                    description: formatTestSteps([
                        'Connect Trezor device to Suite',
                        'Trezor should be "recognized"',
                        'Firmware update modal should appear',
                        'Proceed with the Firmware update',
                        'Firmware update should finish without any errors',
                        'Check the firmware and bootloader version',
                        'Connect Trezor in standard mode',
                        'check "firmware" version via "trezorctl get-features"',
                        'Connect Trezor in bootloader mode',
                        'Check "bootloader" version via "trezorctl get-features"',
                    ]),
                },
            ],
        },
        async () => {},
    );

    test(
        'Bootloader update Model One',
        {
            annotation: [
                {
                    type: TestAnnotation.TestCase,
                    description:
                        'Verifies that a user can update the bootloader.',
                },
                { 
                    type: TestAnnotation.Prerequisites, 
                    description: formatTestSteps([
                        'Trezor  device with at least a year old BL/FW (older then the latest)',
                        'Connected Trezor Suite',
                    ]), 
                },
                {
                    type: TestAnnotation.Steps,
                    description: formatTestSteps([
                        'Connect Trezor device to Trezor Suite',
                        'Trezor should be recognized',
                        'Firmware update modal should appear',
                        'Proceed with the Firmware update',
                        'Firmware update should finish without any errors',
                        'Check the firmware and bootloader version',
                        'Connect Trezor in standard mode',
                        'check firmware version via trezorctl get-features',
                        'Connect Trezor in bootloader mode',
                        'check bootloader version via trezorctl get-features',
                    ]),
                },
            ],
        },
        async () => {},
    );
});
