import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Connected apps - WalletConnect', { tag: ['@group=manual'] }, () => {
    test(
        'WalletConnect session management',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can connect a dApp via WalletConnect and manage the session in Connected apps.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'Funded EVM account',
                    'A dApp supporting WalletConnect (e.g. app.uniswap.org)',
                ],
                steps: [
                    'Navigate to "Settings" > "Connected apps"',
                    'On the dApp side, choose WalletConnect connection and copy the pairing URI',
                    'Paste the URI into the WalletConnect connect field in Suite',
                    'Confirm the connection prompt (accounts and chains) in Suite',
                    'Confirm the dApp shows the wallet as connected',
                    'Confirm the session is listed in "Connected apps" with correct dApp name and accounts',
                    'Trigger an action from the dApp (e.g. sign a message) and confirm the request appears in Suite and on the device',
                    'Disconnect the session from "Connected apps"',
                    'Confirm the session disappears from the list and the dApp shows disconnected state',
                ],
                category: TestCategory.WalletConnect,
                priority: TestPriority.High,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );
});
