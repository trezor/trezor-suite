import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Named address resolution', { tag: ['@group=manual'] }, () => {
    test(
        'Send to an ENS name and verify the resolved address',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that an ENS name entered in the Send form resolves to an address, that the resolved address is what the user confirms and the device signs, and that unresolvable names are rejected.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'Funded Ethereum account - ENS resolution is only supported on "eth" and "tsep"',
                    'A funded EVM account on a network without name support (eg. Polygon or BSC)',
                    'An ENS name whose resolved address is known upfront',
                ],
                steps: [
                    'Navigate to the funded Ethereum account and open the "Send" form',
                    'Confirm the recipient field placeholder offers a name as well as an address',
                    'Type the ENS name into the recipient field',
                    'Confirm "Resolving name…" is shown while the lookup runs',
                    'Confirm the resolved address is shown below the field as "Wallet address: <address>" and matches the address known upfront',
                    'Fill in an amount and continue to the review step',
                    'Confirm the review step shows "Sending to <name>" together with "Wallet address: <address>"',
                    'Confirm the address shown on the Trezor display is the resolved address, not the name',
                    'Sign the transaction and confirm the outgoing transaction in the history is addressed to the resolved address',
                ],
                category: TestCategory.ETH,
                priority: TestPriority.Critical,
                stream: TestStream.Network,
            }),
        },
        async () => {},
    );

    test(
        'Reverse resolution and unsupported or unresolvable names',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies the reverse lookup of a pasted address, the error state for an unresolvable name, and that no resolution is attempted on networks without name support.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'Funded Ethereum account',
                    'A funded EVM account on a network without name support (eg. Polygon or BSC)',
                    'An address that has a primary ENS name set',
                ],
                steps: [
                    'Open the "Send" form of the Ethereum account',
                    'Paste an address that has a primary ENS name set',
                    'Confirm the primary name is shown below the field as "Wallet: <name>"',
                    'Clear the field and enter a name that does not resolve (eg. a random subdomain)',
                    'Confirm the error "Could not resolve name. Check that the name is correct." is shown and the form cannot be submitted',
                    'Enter a name with fewer than two characters after the last dot and confirm it is treated as a plain address, not as a name',
                    'Switch to the account on the network without name support',
                    'Enter the same ENS name that resolved on Ethereum',
                    'Confirm no resolution is attempted - no "Resolving name…" state and no resolved address - and the value is rejected as an invalid address',
                ],
                category: TestCategory.ETH,
                priority: TestPriority.High,
                stream: TestStream.Network,
            }),
        },
        async () => {},
    );
});
