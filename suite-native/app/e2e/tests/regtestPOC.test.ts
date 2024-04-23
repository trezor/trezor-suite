import { expect as detoxExpect } from 'detox';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { appIsFullyLoaded, openApp, restartApp } from '../utils';
import { xpubs } from '../fixtures/xpubs';
import { onAccountImport } from '../pageObjects/accountImportActions';
import { onMyAssets } from '../pageObjects/myAssetsActions';
import { onOnboarding } from '../pageObjects/onboardingActions';
import { onHome } from '../pageObjects/homeActions';

// TODO: This is not a full test suite, just a proof of concept of regtest <---> suite-native integration.
//       The suite will be extended/modified in the future by the QA team.
describe('Regtest integration proof of concept.', () => {
    beforeAll(async () => {
        await openApp({ newInstance: true });
        await onOnboarding.finishOnboarding();
    });

    beforeEach(async () => {
        await restartApp();
        await appIsFullyLoaded();
    });

    it('Mine regtest transaction and check that it is present in the account transaction list.', async () => {
        const amountToSend = 42;

        // send transaction of 42 BTC and mine it
        await TrezorUserEnvLink.api.sendToAddressAndMineBlock({
            address: 'bcrt1qjf6qnquchwl6drvrf2ar73l6p9m3gzwlev9qd4',
            btc_amount: amountToSend,
        });

        await onHome.tapSyncCoinsButton();

        const accountName = 'Regtest #1';
        await onAccountImport.importAccount({
            networkSymbol: 'regtest',
            xpub: xpubs.regtest,
            accountName,
        });

        await onMyAssets.openAccountDetail({ accountName });

        // Check if the transaction is present in the account transaction list.
        await detoxExpect(element(by.text(`${amountToSend} BTC REGTEST`)).atIndex(0)).toBeVisible();
    });
});
