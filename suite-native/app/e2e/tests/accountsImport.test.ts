import { appIsFullyLoaded, openApp, restartApp } from '../utils';
import { xpubs } from '../fixtures/xpubs';
import { importAccount } from '../pageObjects/accountImport';
import { navigateToMyAssets, tapAddAccountButton } from '../pageObjects/myAssets';
import { finishOnboarding } from '../pageObjects/onboarding';

describe('Import all possible accounts in watch only mode.', () => {
    beforeAll(async () => {
        await openApp({ newInstance: true });
        await finishOnboarding();
    });

    beforeEach(async () => {
        await restartApp();
        await appIsFullyLoaded();
    });

    it('Import BTC SegWit account', async () => {
        // first account is imported with Sync button
        await element(by.id('@screen/mainScrollView')).scrollTo('bottom');
        await element(by.id('@home/portfolio/sync-coins-button')).tap();
        await importAccount({
            networkSymbol: 'btc',
            xpub: xpubs.btc.segwit,
            accountName: 'BTC SegWit',
        });
    });

    it('Import BTC Legacy SegWit account', async () => {
        await navigateToMyAssets();
        await tapAddAccountButton();
        await importAccount({
            networkSymbol: 'btc',
            xpub: xpubs.btc.legacySegwit,
            accountName: 'BTC Legacy SegWit',
        });
    });

    it('Import BTC Taproot account', async () => {
        await navigateToMyAssets();
        await tapAddAccountButton();
        await importAccount({
            networkSymbol: 'btc',
            xpub: xpubs.btc.taproot,
            accountName: 'BTC Taproot',
        });
    });

    it('Import BTC Legacy account', async () => {
        await navigateToMyAssets();
        await tapAddAccountButton();
        await importAccount({
            networkSymbol: 'btc',
            xpub: xpubs.btc.legacy,
            accountName: 'BTC Legacy',
        });
    });

    it('Import LTC account', async () => {
        await navigateToMyAssets();
        await tapAddAccountButton();
        await importAccount({
            networkSymbol: 'ltc',
            xpub: xpubs.ltc,
            accountName: 'Litecoin SegWit',
        });
    });

    it('Import Cardano account', async () => {
        await navigateToMyAssets();
        await tapAddAccountButton();
        await importAccount({
            networkSymbol: 'ada',
            xpub: xpubs.ada,
            accountName: 'Cardano #1',
        });
    });

    it('Import DOGE account', async () => {
        await navigateToMyAssets();
        await tapAddAccountButton();
        await importAccount({
            networkSymbol: 'doge',
            xpub: xpubs.doge,
            accountName: 'Dogecoin #1',
        });
    });

    it('Import ZCash account', async () => {
        await navigateToMyAssets();
        await tapAddAccountButton();
        await importAccount({
            networkSymbol: 'zec',
            xpub: xpubs.zec,
            accountName: 'Zcash #1',
        });
    });

    it('Import XRP account', async () => {
        await navigateToMyAssets();
        await tapAddAccountButton();
        await importAccount({
            networkSymbol: 'xrp',
            xpub: xpubs.xrp,
            accountName: 'Ripple #1',
        });
    });

    it('Import ETH account', async () => {
        await navigateToMyAssets();
        await tapAddAccountButton();
        await importAccount({
            networkSymbol: 'eth',
            xpub: xpubs.eth,
            accountName: 'Ethereum #1',
        });
    });
});
