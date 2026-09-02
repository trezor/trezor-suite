import { type EventInstance, events } from '@suite-common/analytics';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type EvmPendingTxStatus, type WrappedNativeFlowType } from '@suite-common/wallet-core';

export type WrappedNativeFlowPayload = EventInstance<typeof events.yieldWrapEvent>['payload'];

export const buildWrappedNativeFlowEvent = (
    flowType: WrappedNativeFlowType,
    payload: WrappedNativeFlowPayload,
) => ({
    type: flowType === 'wrap' ? events.yieldWrapEvent.name : events.yieldUnwrapEvent.name,
    payload,
});

type WrappedNativeResolutionParams = {
    durationMs: number | undefined;
    networkSymbol: NetworkSymbol | undefined;
    status: EvmPendingTxStatus | null;
};

export const getWrappedNativeResolutionPayload = ({
    durationMs,
    networkSymbol,
    status,
}: WrappedNativeResolutionParams): WrappedNativeFlowPayload | null => {
    if (status === 'confirmed') {
        return { type: 'success', action: 'continue', networkSymbol, durationMs };
    }

    if (status === 'failed') {
        return {
            type: 'error',
            action: 'continue',
            networkSymbol,
            durationMs,
            errorMessage: 'on-chain-failure',
        };
    }

    return null;
};

export const getWrappedNativeMaxInteractionElement = (flowType: WrappedNativeFlowType) =>
    flowType === 'wrap' ? 'wrap-max' : 'unwrap-max';
