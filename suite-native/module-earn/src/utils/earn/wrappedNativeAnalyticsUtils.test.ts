import { events } from '@suite-common/analytics';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import {
    type WrappedNativeFlowPayload,
    buildWrappedNativeFlowEvent,
    getWrappedNativeMaxInteractionElement,
    getWrappedNativeResolutionPayload,
} from './wrappedNativeAnalyticsUtils';

const ALLOWED_PAYLOAD_KEYS = ['type', 'action', 'networkSymbol', 'durationMs', 'errorMessage'];
const ethSymbol = asNetworkSymbol('eth');

const expectOnlyAllowedKeys = (payload: WrappedNativeFlowPayload | null) => {
    expect(payload).not.toBeNull();
    Object.keys(payload ?? {}).forEach(key => {
        expect(ALLOWED_PAYLOAD_KEYS).toContain(key);
    });
};

describe('buildWrappedNativeFlowEvent', () => {
    it('builds a yield/wrap event for the wrap flow', () => {
        const payload = { type: 'submit', action: 'continue', networkSymbol: ethSymbol } as const;

        expect(buildWrappedNativeFlowEvent('wrap', payload)).toEqual({
            type: events.yieldWrapEvent.name,
            payload,
        });
    });

    it('builds a yield/unwrap event for the unwrap flow', () => {
        const payload = { type: 'submit', action: 'continue', networkSymbol: ethSymbol } as const;

        expect(buildWrappedNativeFlowEvent('unwrap', payload)).toEqual({
            type: events.yieldUnwrapEvent.name,
            payload,
        });
    });

    it('passes the payload through unchanged', () => {
        const payload = {
            type: 'error',
            action: 'continue',
            networkSymbol: ethSymbol,
            durationMs: 1234,
            errorMessage: 'push-failed',
        } as const;

        expect(buildWrappedNativeFlowEvent('wrap', payload).payload).toBe(payload);
    });
});

describe('getWrappedNativeResolutionPayload', () => {
    it('returns a success payload when the transaction confirmed', () => {
        const payload = getWrappedNativeResolutionPayload({
            durationMs: 5000,
            networkSymbol: ethSymbol,
            status: 'confirmed',
        });

        expect(payload).toEqual({
            type: 'success',
            action: 'continue',
            networkSymbol: ethSymbol,
            durationMs: 5000,
        });
        expectOnlyAllowedKeys(payload);
    });

    it('returns an on-chain-failure error payload when the transaction failed', () => {
        const payload = getWrappedNativeResolutionPayload({
            durationMs: 5000,
            networkSymbol: ethSymbol,
            status: 'failed',
        });

        expect(payload).toEqual({
            type: 'error',
            action: 'continue',
            networkSymbol: 'eth',
            durationMs: 5000,
            errorMessage: 'on-chain-failure',
        });
        expectOnlyAllowedKeys(payload);
    });

    it('returns null while the transaction is still pending', () => {
        expect(
            getWrappedNativeResolutionPayload({
                durationMs: 5000,
                networkSymbol: ethSymbol,
                status: 'pending',
            }),
        ).toBeNull();
    });

    it('returns null when there is no status', () => {
        expect(
            getWrappedNativeResolutionPayload({
                durationMs: 5000,
                networkSymbol: ethSymbol,
                status: null,
            }),
        ).toBeNull();
    });

    it('preserves an undefined durationMs', () => {
        const payload = getWrappedNativeResolutionPayload({
            durationMs: undefined,
            networkSymbol: ethSymbol,
            status: 'confirmed',
        });

        expect(payload).toEqual({
            type: 'success',
            action: 'continue',
            networkSymbol: 'eth',
            durationMs: undefined,
        });
    });
});

describe('getWrappedNativeMaxInteractionElement', () => {
    it('returns wrap-max for the wrap flow', () => {
        expect(getWrappedNativeMaxInteractionElement('wrap')).toBe('wrap-max');
    });

    it('returns unwrap-max for the unwrap flow', () => {
        expect(getWrappedNativeMaxInteractionElement('unwrap')).toBe('unwrap-max');
    });
});
