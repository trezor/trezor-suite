import { type AnalyticsSharedEvents, events } from '@suite-common/analytics';
import { type Analytics } from '@trezor/analytics-uploader';

type SignMessageAttributes = {
    status: 'success' | 'error' | 'cancelled';
    error?: string;
    symbol: string;
    hex: boolean;
    /**
     * Only networks that offer a choice of signature format send this; see the attribute's
     * description in `coinSignMessageEvent`.
     */
    signatureFormat?: 'trezor' | 'electrum';
};

type VerifyMessageAttributes = {
    status: 'success' | 'error' | 'cancelled';
    error?: string;
    symbol: string;
    hex: boolean;
};

export const reportSignMessage = (
    analytics: Analytics<AnalyticsSharedEvents>,
    payload: SignMessageAttributes,
) => analytics.report({ type: events.coinSignMessageEvent.name, payload });

export const reportVerifyMessage = (
    analytics: Analytics<AnalyticsSharedEvents>,
    payload: VerifyMessageAttributes,
) => analytics.report({ type: events.coinVerifyMessageEvent.name, payload });
