import { TestAnnotation } from '../../../support/enums/testAnnotation';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Address scan', { tag: ['@group=manual'] }, () => {
    test(
        'Scan send address via camera',
        {
            annotation: [
                {
                    type: TestAnnotation.TestCase,
                    description:
                        'Verifies that a user can scan a QR code to autofill the recipient address when sending BTC.',
                },
                { 
                    type: TestAnnotation.Prerequisites, 
                    description: formatTestSteps([
                        'Seeded Trezor device',
                        'Connected Trezor Suite'
                    ]), 
                },
                {
                    type: TestAnnotation.Steps,
                    description: formatTestSteps([
                        'Click on "Accounts"',
                        'Select a BTC account if it’s not selected',
                        'Click "Send"',
                        'Press "Scan" button that is available only after hovering over address field',
                        'Scan QR code',
                        'Check that expected string was decoded from QR code',
                    ]),
                },
            ],
        },
        async () => {},
    );
});
