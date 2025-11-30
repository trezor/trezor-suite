import type { Model } from '@suite-common/suite-types';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { SuiteAnalyticsEvent } from '@trezor/suite-analytics';
import type { StartEmu } from '@trezor/trezor-user-env-link';

import { urlSearchParams } from '../../../src/utils/suite/metadata';

export type Requests = ReturnType<typeof urlSearchParams>[];

export type ExtractByEventType<EventType> = Extract<SuiteAnalyticsEvent, { type: EventType }>;

export type EventPayload<T extends SuiteAnalyticsEvent> = T extends { payload: infer P }
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

export type StartEmuModelRequired = Omit<StartEmu, 'version'> & { model: Model };

export type LaunchSuiteParams = {
    keepUserData?: boolean;
    bridgeDaemon?: boolean;
    exposeConnectWs?: boolean;
    locale?: string;
    colorScheme?: 'light' | 'dark' | 'no-preference' | null | undefined;
    artefactFolder: string;
    viewport: { width: number; height: number };
    disableAuthenticityCheck?: boolean;
};

export type ElectronConf = Pick<
    LaunchSuiteParams,
    'keepUserData' | 'bridgeDaemon' | 'exposeConnectWs' | 'disableAuthenticityCheck'
>;

declare global {
    interface Window {
        // Needed for Cypress and Playwright
        Playwright?: any;
        store?: any;
    }
}
