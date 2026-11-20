import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Enable ADA and TRX from the Earn tab',
        {
            testCase:
                'Cardano and Tron can be enabled from the Earn screen staking list when the networks are disabled',
            prerequisites: [
                'connected device',
                'Cardano and Tron disabled in the app',
                'seed with an ADA and a TRX account, both with an active stake created in Trezor Suite on desktop',
            ],
            steps: [
                'Navigate to the Earn screen and verify ADA and TRX are offered in the staking list',
                'Tap ADA and verify the "Enable Cardano to start staking" sheet is displayed',
                'Dismiss the sheet and verify Cardano stays disabled',
                'Tap ADA again, tap "Enable Cardano" and verify the account discovery runs',
                'Verify the ADA staking management screen opens, go back and verify the ADA position is listed on the Earn screen',
                'Repeat the flow for TRX and verify the TRX staking management screen opens',
                'Verify both networks are enabled in the coin settings',
            ],
            category: TestCategory.Earn,
            priority: TestPriority.High,
            stream: TestStream.Earn,
        },
        async () => {},
    );

    it(
        'ADA and TRX from the Earn tab without a stake',
        {
            testCase:
                'Tapping Cardano or Tron staking without an active stake points the user to Trezor Suite on desktop',
            prerequisites: [
                'connected device',
                'Cardano and Tron enabled in the app',
                'seed with an ADA and a TRX account without any stake',
            ],
            steps: [
                'Navigate to the Earn screen and tap ADA in the staking list',
                'Verify the "Manage Staking in the Trezor Suite desktop app" sheet is displayed',
                'Hold the link and verify it is copied to the clipboard',
                'Dismiss the sheet, tap TRX and verify the same sheet is displayed',
            ],
            category: TestCategory.Earn,
            priority: TestPriority.Medium,
            stream: TestStream.Earn,
        },
        async () => {},
    );

    it(
        'Enable ADA and TRX from the Earn tab with a disconnected device',
        {
            testCase: 'Enabling a network from the Earn screen requires a connected device',
            prerequisites: [
                'remembered (view-only) wallet with the device disconnected',
                'Cardano and Tron disabled in the app',
            ],
            steps: [
                'Navigate to the Earn screen and tap ADA in the staking list',
                'Tap "Enable Cardano" and verify the "Connect & unlock your Trezor to enable Cardano" alert is displayed',
                'Confirm the alert and verify Cardano stays disabled',
                'Repeat for TRX and verify the alert names Tron',
            ],
            category: TestCategory.Earn,
            priority: TestPriority.Low,
            stream: TestStream.Earn,
        },
        async () => {},
    );
});
