import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Trading network edge cases', { tag: ['@group=manual'] }, () => {
    test(
        'XLM token activation in Trade',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that swapping or buying to an inactive Stellar trustline prompts Activate token in Trade before the trade can continue.',
                prerequisites: [
                    'Seeded Trezor device with Stellar support',
                    'Connected Trezor Suite with a funded XLM account (enough above reserve for a trustline)',
                    'Target Stellar token not yet activated on the receive account',
                ],
                steps: [
                    'Open Trade → Swap (or Buy) with To / You buy set to an inactive Stellar token on the Suite XLM account',
                    'Fill a valid amount so the form would otherwise continue',
                    'Confirm the primary CTA becomes Activate token instead of Swap / Continue',
                    'Start activation; confirm the activation fee / modal; approve on the Trezor device',
                    'Confirm the token is activated (toast / Tokens list)',
                    'Return to the trade form; confirm Swap / Continue is available and complete or abandon the trade as needed',
                ],
                category: TestCategory.Swap,
                priority: TestPriority.High,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'Tron cold address and fee messaging in Trade',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies Tron Sell/Swap fee compose and activation / bandwidth / energy messaging when trading TRX (cold-recipient fee path).',
                prerequisites: [
                    'Seeded Trezor device with Tron support (not T1B1)',
                    'Connected Trezor Suite with a funded TRX account',
                ],
                steps: [
                    'Open Trade → Sell or Swap with From / You sell set to Tron (TRX)',
                    'Fill a valid amount so quotes and Network fee / fee details load',
                    'Confirm fee estimation completes for the trade (Suite uses a derived unused cold recipient for compose where applicable)',
                    'If selling/sending toward a new or inactive Tron destination in related flows, confirm Activation fee messaging is communicated',
                    'Confirm bandwidth / energy vs burned TRX fee messaging when shown on review',
                    'Confirm no fee level can be selected on Tron; proceed to device confirm and verify the fee fields on the device match Suite',
                ],
                category: TestCategory.TradeTab,
                priority: TestPriority.High,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'USDT DEX revoke then approve higher allowance',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies USDT cannot increase allowance in place: user must Revoke approval, then set a higher approval, then Swap.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite with Ethereum USDT balance and an existing spender allowance that is too low for the intended swap amount',
                    'A DEX offer available (e.g. LI.FI)',
                ],
                steps: [
                    'Open Trade → Swap; From = Tether (USDT) on Ethereum; select a To asset and amount that exceeds the current allowance',
                    'Confirm a DEX Provider (e.g. LI.FI) and that "Revoke approval" is available',
                    'Confirm messaging that the approved amount is too low and revoke is required before setting a higher limit',
                    'Open Maximum fee; select Customize fee with a distinct rate; note the fee on Suite',
                    'Click "Revoke approval"; confirm revoke on Suite and on the Trezor device; confirm the fee on device matches Suite if shown; wait until revoking completes',
                    'Set & approve spending for the new (higher or exact) amount; confirm on the device including fee match if shown',
                    'After approval confirms, click "Swap"; on the device confirm the swap fee matches the custom Maximum fee from Suite',
                    'Complete or verify the swap can proceed',
                ],
                category: TestCategory.Swap,
                priority: TestPriority.High,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'Unlimited DEX token approval',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies Unlimited (INFINITE) DEX approval: approve once, confirm on device, then a later swap for the same spender skips a new approve.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite with an EVM token that requires approval (e.g. USDC) and no residual conflicting USDT-only revoke state',
                    'A DEX offer available',
                ],
                steps: [
                    'Open Trade → Swap for a token that needs approval',
                    'Fill amount so Maximum fee appears; open Maximum fee and select Customize fee with a distinct rate; note the fee on Suite',
                    'Open Set & approve spending / approve modal',
                    'Select "Unlimited" approval (not the exact swap amount)',
                    'Confirm unlimited warning/info on Suite; approve on the Trezor device; confirm the approval fee on device matches Suite if shown',
                    'Wait until approval confirms; complete the first swap; on the device confirm the swap fee matches the custom Maximum fee from Suite',
                    'Start a second Swap for the same token and spender with an amount covered by the unlimited allowance',
                    'Confirm Swap proceeds without requiring a new approval transaction',
                    'Optionally compare with exact (minimal) approval: after spending the exact amount, a further swap requires a new approval',
                ],
                category: TestCategory.Swap,
                priority: TestPriority.High,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );
});
