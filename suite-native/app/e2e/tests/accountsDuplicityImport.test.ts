import { appIsFullyLoaded, openApp, restartApp } from '../utils';
import { xpubs } from '../fixtures/xpubs';
import { onAccountImport } from '../pageObjects/accountImportActions';
import { onOnboarding } from '../pageObjects/onboardingActions';
import { onHome } from '../pageObjects/homeActions';

describe('Import an already imported XPUB', () => {
    beforeAll(async () => {
        await openApp({ newInstance: true });
        await onOnboarding.finishOnboarding();
    });

    beforeEach(async () => {
        await restartApp();
        await appIsFullyLoaded();
    });

    it('Import BTC SegWit account', async () => {
        await onHome.tapSyncCoinsButton();
        await onAccountImport.importAccount({
            networkSymbol: 'btc',
            xpub: xpubs.btc.segwit,
            accountName: 'BTC SegWit',
        });
    });

    it('Import BTC same SegWit account', async () => {
        await onHome.tapSyncCoinsButton();
        await onAccountImport.importSameAccount({
            networkSymbol: 'btc',
            xpub: xpubs.btc.segwit,
            accountName: 'BTC SegWit',
        });
    });
});
