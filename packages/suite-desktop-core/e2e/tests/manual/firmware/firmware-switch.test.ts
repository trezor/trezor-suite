import { TestAnnotation } from '../../../support/enums/testAnnotation';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Firmware switch', { tag: ['@group=manual'] }, () => {
    test(
        'Switch to Bitcoin-only firmware',
        {
            annotation: [
                {
                    type: TestAnnotation.TestCase,
                    description:
                        'Verifies that a user can switch to Bitcoin-only firmware on a Trezor device.',
                },
                {
                    type: TestAnnotation.Prerequisites,
                    description: formatTestSteps([
                        'Trezor device with Universal firmware',
                        'Connected Trezor Suite',
                    ]),
                },
                {
                    type: TestAnnotation.Steps,
                    description: formatTestSteps([
                        'Navigate to "Settings/Device"',
                        'In firmware section "Switch to Bitcoin" button is located',
                        'Press it and proceed with "Firmware installation"',
                        'After installation and restart of device "Your firmware type is" "Bitcoin-only" is displayed',
                    ]),
                },
            ],
        },
        async () => {},
    );
});
