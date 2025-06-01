import { TestCategory, TestPriority, TestStream } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

// Send token

test.describe.skip('Eth transactions Send token', { tag: ['@group=manual'] }, () => {
    test(
        'Perform Ethereum transactions with token',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can send tokens on the Ethereum',
                prerequisites: [
                    'Seeded Trezor device',
                    'Trezor Suite with a funded wallet connected',
                ],
                steps: [
                    'navigate to the "Accounts"',
                    'Select or enable and then Select "Ethereum"',
                    'Select random user account',
                    'Click receive button',
                    'Click on "Show full address" button',
                    'Receive address and QR code is displayed',
                    'Confirm address on Device',
                    'Press "Copy address button"',
                    'Navigate to different account that holds funds',
                    'Click on "Send" button',
                    'Fill out Address field with copied address and amount field',
                    '"Review & Send transaction" via Suite and device button',
                    'Bump transaction fee of already sent transaction',
                    'Make sure it is mined',
                ],
                category: TestCategory.ETH,
                priority: TestPriority.High,
                stream: TestStream.Trends,
            }),
        },
        async () => {},
    );

    test(
        'Perform Ethereum transactions with unrecognized token',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can attempt to send an unrecognized token on the Ethereum',
                prerequisites: [
                    'Seeded Trezor device',
                    'Trezor Suite with a funded wallet connected',
                ],
                steps: [
                    'navigate to the "Accounts"',
                    'Select or enable and then Select "Ethereum"',
                    'Select random user account',
                    'Click receive button',
                    'Click on "Show full address" button',
                    'Receive address and QR code is displayed',
                    'Confirm address on Device',
                    'Press "Copy address button"',
                    'Navigate to different account that holds funds',
                    'Click on "Send" button',
                    'Fill out Address field with copied address and amount field',
                    'Select an unrecognized token from the token dropdown',
                    '"Review & Send transaction" via Suite and device button',
                    'Verify error or warning message for unrecognized token',
                ],
                category: TestCategory.ETH,
                priority: TestPriority.Low,
                stream: TestStream.Trends,
            }),
        },
        async () => {},
    );
});
