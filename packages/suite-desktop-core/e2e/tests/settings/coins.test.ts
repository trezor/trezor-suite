import { SuiteAnalyticsEvent } from '@trezor/suite-analytics';
import { Requests, EventPayload } from '@trezor/suite-web/e2e/support/types';
import { urlSearchParams } from '@trezor/suite/src/utils/suite/metadata';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { test, expect } from '../../support/fixtures';

//TODO: #15811 To be refactored
export const findAnalyticsEventByType = <T extends SuiteAnalyticsEvent>(
    requests: Requests,
    eventType: T['type'],
) => {
    const event = requests.find(req => req.c_type === eventType) as EventPayload<T>;

    if (!event) {
        throw new Error(`Event with type ${eventType} not found.`);
    }

    return event;
};

let requests: Requests;

test.describe('Coin Settings', { tag: ['@group=settings'] }, () => {
    test.use({ emulatorStartConf: { wipe: true } });
    test.beforeEach(async ({ onboardingPage, dashboardPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
        await settingsPage.navigateTo();
        await settingsPage.coinsTabButton.click();

        requests = [];

        //TODO: #15811 To be refactored
        await onboardingPage.window.route('**://data.trezor.io/suite/log/**', route => {
            const url = route.request().url();
            const params = urlSearchParams(url);
            requests.push(params);
            route.continue();
        });
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
        // const settingsCoinsEvent = findAnalyticsEventByType<
        //     ExtractByEventType<EventType.SettingsCoins>
        // >(requests, EventType.SettingsCoins);
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
        // const settingsCoinsBackendEvent = findAnalyticsEventByType<ExtractByEventType<EventType.SettingsCoinsBackend>>(requests, EventType.SettingsCoinsBackend)
        // expect(settingsCoinsBackendEvent.type).to.equal('blockbook');
        // expect(settingsCoinsBackendEvent.totalRegular).to.equal('1');
        // expect(settingsCoinsBackendEvent.totalOnion).to.equal('0');
    });
});
