import { AnalyticsDesktopEvents } from '@suite/analytics';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { urlSearchParams } from '@trezor/suite/src//utils/suite/metadata';
import { TrezorUserEnvLinkClass } from '@trezor/trezor-user-env-link';

import { LaunchSuiteParams } from '../electron';
export type Requests = ReturnType<typeof urlSearchParams>[];

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
