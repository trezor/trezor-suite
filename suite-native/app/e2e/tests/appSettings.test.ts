import { PROTO } from '@trezor/connect';

import { xpubs } from '../fixtures/xpubs';
import { onAccountImport } from '../pageObjects/accountImportActions';
import { onHome } from '../pageObjects/homeActions';
import { onOnboarding } from '../pageObjects/onboardingActions';
import { onSettings } from '../pageObjects/settingsActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { appIsFullyLoaded, openApp, restartApp } from '../utils';

describe('App Settings - without device interactions', () => {
    beforeAll(async () => {
        await openApp({ newInstance: true });
        await onOnboarding.skipOnboarding();

        await onHome.tapSyncCoinsButton();
        await onAccountImport.importAccount({
            networkSymbol: 'btc',
            xpub: xpubs.btc.segwit,
            accountName: 'BTC SegWit',
        });
    });

    beforeEach(async () => {
        await restartApp();
        await appIsFullyLoaded();
    });

    afterAll(async () => {
        await device.terminateApp();
    });

    it('Localization - Currency', async () => {
        await waitFor(
            element(by.id('@home/portfolio/fiat-balance-header').withDescendant(by.text('$'))),
        )
            .toBeVisible()
            .withTimeout(10000);

        await onTabBar.navigateToSettings();
        await onSettings.tapLocalization();
        await onSettings.changeLocalizationCurrency('czk');
        await device.pressBack();
        await device.pressBack();

        await waitFor(
            element(by.id('@home/portfolio/fiat-balance-header').withDescendant(by.text('CZK'))),
        )
            .toBeVisible()
            .withTimeout(10000);
    });

    it('Localization - Bitcoin Units', async () => {
        await waitFor(element(by.text('0 BTC')))
            .toBeVisible()
            .withTimeout(10000);

        await onTabBar.navigateToSettings();
        await onSettings.tapLocalization();
        await onSettings.changeBitcoinUnits(PROTO.AmountUnit.SATOSHI);
        await device.pressBack();
        await device.pressBack();

        await waitFor(element(by.text('0 sat')))
            .toBeVisible()
            .withTimeout(10000);
    });

    it('Privacy & Security - Discreet Mode', async () => {
        await onHome.assertIsDiscreetModeDisabled();

        await element(by.id('@home/portfolio/fiat-balance-header')).tap();

        await onHome.assertIsDiscreetModeEnabled();

        await onTabBar.navigateToSettings();
        await onSettings.tapPrivacyAndSecurity();
        await onSettings.toggleDiscreetMode();
        await device.pressBack();
        await device.pressBack();

        await onHome.assertIsDiscreetModeDisabled();
    });
});
