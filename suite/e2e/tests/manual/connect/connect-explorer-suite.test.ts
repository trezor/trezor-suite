import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Trezor Connect Explorer', { tag: ['@group=manual'] }, () => {
    test(
        'Test Trezor Connect Explorer methods',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can use Trezor Connect',
                prerequisites: [
                    'Seeded Trezor device',
                    'opened Trezor Suite with wallet connected',
                ],
                steps: [
                    'navigate to the "https://dev.suite.sldev.cz/connect/develop/" or "https://connect.trezor.io/9/"',
                    'select Bitcoin "getAdderess" method, and in Method testing tool click "Get address"',
                    'Grant permissions in Trezor Suite popup',
                    'confirm the action on the device and validate that the Response result is True',
                    'select Ethereum "getPublicKey" method, and in Method testing tool click "Get public key"',
                    'Grant permissions in Trezor Suite popup',
                    'confirm the action on the device and validate that the Response result is True',
                    'select Ethereum "signMessage" method, fill in the Message to sign field and click "Sign message"',
                    'Grant permissions in Trezor Suite popup',
                    'confirm the action on the device and validate that the Response result is True',
                    'select Solana "signTransaction" method, fill in the required fields and click "Sign transaction"',
                    'Grant permissions in Trezor Suite popup',
                    'confirm the action on the device and validate that the Response result is True',
                    'select Cardano "getAddress" method, fill in the required fields and click "Get address"',
                    'Grant permissions in Trezor Suite popup',
                    'confirm the action on the device and validate that the Response result is True',
                    'select Tron "signTransaction" method, fill in the required fields and click "Sign transaction"',
                    'Grant permissions in Trezor Suite popup',
                    'confirm the action on the device and validate that the Response result is True',
                    'select Ripple "signTransaction" method, fill in the required fields and click "Sign transaction"',
                    'Grant permissions in Trezor Suite popup',
                    'confirm the action on the device and validate that the Response result is True',
                ],
                category: TestCategory.TrezorConnect,
                priority: TestPriority.Critical,
                stream: TestStream.Connect,
            }),
        },
        async () => {},
    );
});
