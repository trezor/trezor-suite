import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Earn vault detail screen',
        {
            testCase: 'The vault detail screen shows correct vault information and rates',
            prerequisites: ['connected device', 'seed with a yield-eligible account on it'],
            steps: [
                'Navigate to the Earn screen and open a vault detail',
                'Verify the vault information is displayed correctly (name, token, rate, deposits)',
                'Verify the rate badge on earnable tokens matches the rate kind (no APY label where a plain rate is used)',
                'Verify the vault token symbol is displayed in its original casing (not uppercased)',
                'Open the rate breakdown and verify it explains how the rate is composed',
                'Start a deposit from the vault detail and verify the app navigates to the deposit flow',
                'With claimable rewards available, open the claim entry flow and verify the vault association is shown',
            ],
            category: TestCategory.Earn,
            priority: TestPriority.Medium,
            stream: TestStream.Earn,
        },
        async () => {},
    );
});
