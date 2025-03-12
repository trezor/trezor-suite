import { TestAnnotation } from '../../../support/enums/testAnnotation';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Cardano transactions', { tag: ['@group=manual'] }, () => {
    test(
        'Cardano transaction history, details, receive, send',
        {
            annotation: [
                {
                    type: TestAnnotation.TestCase,
                    description:
                        'Verifies that a user can view transaction history, transaction details, receive funds, and send funds on the Cardano network.',
                },
                { 
                    type: TestAnnotation.Prerequisites, 
                    description: formatTestSteps([
                        'Seeded Trezor device',
                        'Trezor Suite app with a funded wallet connected'
                    ]), 
                },
                {
                    type: TestAnnotation.Steps,
                    description: formatTestSteps([
                        'navigate to the "Accounts"',
                        'Select or enable and then Select "Cardano"',
                        'Select a random user "account"',
                        'Transaction history is present',
                        'Transaction history graph is rendered as expected',
                        'Select a random "transaction"',
                        'Transaction details are present',
                        'Close the "transaction" detail',
                        'Click on the "receive" button',
                        'Fresh address and previously used addresses are present',
                        'Click on "Show full address" button',
                        'Receive address and QR code is displayed',
                        'Scan and compare "QR code" on device and in Suite',
                        'Confirm address on Device',
                        'Press "Copy address button"',
                        'Navigate to different account that holds funds',
                        'Click on "Send" button',
                        'Fill out Address field with copied address and amount field',
                        '"Review & Send transaction" via Suite and device button',
                    ]),
                },
            ],
        },
        async () => {},
    );
});
