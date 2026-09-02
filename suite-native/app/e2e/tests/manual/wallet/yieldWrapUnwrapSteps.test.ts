import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Yield deposit with wrap step (WETH vault)',
        {
            testCase:
                'Native ETH can be deposited into a WETH vault, with the wrap step included in the deposit flow',
            prerequisites: [
                'connected device with firmware 2.12.4 or newer',
                'seed with native ETH funds (no WETH) on it',
            ],
            steps: [
                'Navigate to the Earn screen and verify the native ETH balance is counted as depositable for the WETH vault',
                'Verify the vault is communicated as ETH (icon and symbol), not WETH',
                'Start the deposit flow and fill in an amount higher than the WETH balance',
                'Verify the wrap step is added to the flow and review its transaction data',
                'Sign the wrap transaction on the device and verify the flow continues to the deposit step',
                'Verify no separate approval step is required for the vault deposit',
                'Review the deposit transaction data and sign it on the device',
                'Verify the complete screen and that the position is displayed in the yield overview',
            ],
            category: TestCategory.Earn,
            priority: TestPriority.High,
            stream: TestStream.Earn,
        },
        async () => {},
    );

    it(
        'Yield withdraw with unwrap step (WETH vault)',
        {
            testCase:
                'A WETH vault position can be withdrawn with the unwrap step included, ending in native ETH',
            prerequisites: [
                'connected device with firmware 2.12.4 or newer',
                'seed with an active WETH vault position',
            ],
            steps: [
                'Navigate to the yield position and start the withdraw flow',
                'Use the max button and verify the fiat summary matches the withdrawn amount',
                'Review the withdraw transaction data and sign it on the device',
                'Verify the unwrap step follows, review its transaction data and sign it on the device',
                'Verify the complete screen shows the received amount in ETH without a minus sign',
                'Verify the native ETH balance increases and the position is removed from the yield overview',
            ],
            category: TestCategory.Earn,
            priority: TestPriority.High,
            stream: TestStream.Earn,
        },
        async () => {},
    );
});
