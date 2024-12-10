import { NetworkSymbol } from '@suite-common/wallet-config';

import { test, expect } from '../../support/fixtures';

test.describe('Coin Settings', { tag: ['@group=settings'] }, () => {
    test.use({ emulatorStartConf: { wipe: true } });
    test.beforeEach(async ({ analytics, onboardingPage, dashboardPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
        await settingsPage.navigateTo();
        await settingsPage.coinsTabButton.click();
        await analytics.interceptAnalytics();
    });

    test('go to wallet settings page, check BTC, activate all coins, deactivate all coins, set custom backend', async ({
        dashboardPage,
        settingsPage,
        window: page,
    }) => {
        const defaultUnchecked: NetworkSymbol[] = [
            'ltc',
            'eth',
            'etc',
            'xrp',
            'bch',
            'btg',
            'dash',
            'dgb',
            'doge',
            'nmc',
            'vtc',
            'zec',
            'ada',
            'sol',
            'test',
            'tsep',
            'thol',
            'txrp',
            'tada',
            'dsol',
        ];

        await expect(settingsPage.coinNetworkButton('btc')).toBeEnabledCoin();
        for (const network of defaultUnchecked) {
            await expect(settingsPage.coinNetworkButton(network)).toBeDisabledCoin();
        }

        await settingsPage.disableCoin('btc');

        // check dashboard with all coins disabled
        await dashboardPage.navigateTo();
        expect(page.getByTestId('@exception/discovery-empty')).toContainText(
            'All coins are disabled in Settings.',
        );

        await settingsPage.navigateTo();
        await settingsPage.coinsTabButton.click();
        // just do some clicking on switches and check result
        for (const network of ['btc', ...defaultUnchecked] as NetworkSymbol[]) {
            await settingsPage.enableCoin(network);
        }

        //TODO: #15811 this is just not useful validation. To be refactored
        // const settingsCoinsEvent = analytics.findAnalyticsEventByType<
        //     ExtractByEventType<EventType.SettingsCoins>
        // >(EventType.SettingsCoins);
        // expect(settingsCoinsEvent.symbol).to.be.oneOf(['btc', ...defaultUnchecked]);
        // expect(settingsCoinsEvent.value).to.be.oneOf(['true', 'false']);

        // custom eth backend
        await page.getByTestId('@settings/wallet/network/eth/advance').click();
        await page.getByTestId('@settings/advance/select-type/input').click();
        await page.getByTestId('@settings/advance/select-type/option/blockbook').click();
        // sometimes select stays open after click, no idea why, experimenting with wait
        await page.getByTestId('@settings/advance/url').fill('https://eth.marek.pl/');
        await page.getByTestId('@settings/advance/button/save').click();

        //TODO: #15811 this is just not useful validation. To be refactored
        // const settingsCoinsBackendEvent = analytics.findAnalyticsEventByType<ExtractByEventType<EventType.SettingsCoinsBackend>>(EventType.SettingsCoinsBackend)
        // expect(settingsCoinsBackendEvent.type).to.equal('blockbook');
        // expect(settingsCoinsBackendEvent.totalRegular).to.equal('1');
        // expect(settingsCoinsBackendEvent.totalOnion).to.equal('0');
    });
});
