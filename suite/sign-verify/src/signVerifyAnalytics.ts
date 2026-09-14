import { type DesktopAnalytics, events } from '@suite/analytics';

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

export const reportSignMessage = (analytics: DesktopAnalytics, payload: SignMessageAttributes) =>
    analytics.report({ type: events.coinSignMessageEvent.name, payload });

export const reportVerifyMessage = (
    analytics: DesktopAnalytics,
    payload: VerifyMessageAttributes,
) => analytics.report({ type: events.coinVerifyMessageEvent.name, payload });
