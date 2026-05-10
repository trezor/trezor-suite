import { CryptoId } from 'invity-api';
import { RequireExactlyOne } from 'type-fest';

import { AnalyticsDesktopEvents } from '@suite/analytics';
import type { NetworkConfigWithoutTestnets, NetworkSymbol } from '@suite-common/wallet-config';
import type { TrezorUserEnvLinkClass } from '@trezor/trezor-user-env-link';

import { LaunchSuiteParams } from '../electron';

/**
 * Desktop analytics events for e2e (findAnalyticsEventByType).
 */
export type SuiteDesktopAnalyticsEventsForE2e = AnalyticsDesktopEvents;

export type ExtractByEventType<EventType> = Extract<
    SuiteDesktopAnalyticsEventsForE2e,
    { type: EventType }
>;

export type EventPayload<T extends SuiteDesktopAnalyticsEventsForE2e> = T extends {
    payload: infer P;
}
    ? P
    : undefined;

export type PaymentMethods =
    | 'googlePay'
    | 'applePay'
    | 'creditCard'
    | 'paypal'
    | 'bankTransfer'
    | 'revolutPay';

export type PercentageOfBalanceParams = {
    percentage: number;
    balance: string | null;
    symbol: NetworkSymbol;
};

declare global {
    interface Window {
        // Needed for Cypress and Playwright
        Playwright?: any;
        store?: any;
    }
}

export type ElectronConf = Pick<
    LaunchSuiteParams,
    'keepUserData' | 'bridgeDaemon' | 'exposeConnectWs' | 'offlineMode'
>;

export type TrezorUserEnv = Pick<
    TrezorUserEnvLinkClass,
    | 'logTestDetails'
    | 'startBridge'
    | 'stopBridge'
    | 'connect'
    | 'disconnect'
    | 'generateBlock'
    | 'mineBlocks'
    | 'sendToAddressAndMineBlock'
>;

export type AssetPickerNetworkFilter = 'all-networks' | NetworkConfigWithoutTestnets['symbol'];

export type BuyAsset = RequireExactlyOne<
    {
        searchFilter?: string;
        networkFilter?: AssetPickerNetworkFilter;
        assetCryptoId?: CryptoId;
        networkSymbol?: NetworkSymbol;
        tokenSymbol?: string;
    },
    'assetCryptoId' | 'networkSymbol'
>;

export type SellAsset = {
    searchFilter?: string;
    networkFilter?: AssetPickerNetworkFilter;
    networkSymbol: NetworkSymbol;
    tokenSymbol?: string;
};
