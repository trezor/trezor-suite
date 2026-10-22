import { useCallback } from 'react';

import { type EventInstance, events } from '@suite-common/analytics';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { useServices } from '@trezor/dependency-injection';

import { useEarnDeviceStatus } from '../earn/useEarnDeviceStatus';

type YieldFlowAnalyticsContext = {
    networkSymbol: NetworkSymbol | undefined;
    vaultId: string | undefined;
};

type WithoutFlowContext<TPayload> = Omit<TPayload, 'networkSymbol' | 'vaultId'>;

type YieldInteractionPayload = WithoutFlowContext<
    EventInstance<typeof events.yieldInteractionEvent>['payload']
>;
type YieldDepositPayload = WithoutFlowContext<
    EventInstance<typeof events.yieldDepositEvent>['payload']
>;
type YieldWithdrawPayload = WithoutFlowContext<
    EventInstance<typeof events.yieldWithdrawEvent>['payload']
>;

export const useYieldFlowAnalytics = ({ networkSymbol, vaultId }: YieldFlowAnalyticsContext) => {
    const { analytics } = useServices(injectNativeAnalytics);
    const deviceStatus = useEarnDeviceStatus();

    const reportInteraction = useCallback(
        (payload: YieldInteractionPayload) => {
            analytics.report({
                type: events.yieldInteractionEvent.name,
                payload: { networkSymbol, vaultId, ...payload },
            });
        },
        [analytics, networkSymbol, vaultId],
    );

    const reportDeposit = useCallback(
        (payload: YieldDepositPayload) => {
            analytics.report({
                type: events.yieldDepositEvent.name,
                payload: {
                    networkSymbol,
                    vaultId,
                    ...payload,
                    ...(payload.action === 'continue' &&
                    ['deposit', 'approve', 'revoke', 'wrap'].includes(payload.type)
                        ? { deviceStatus }
                        : {}),
                },
            });
        },
        [analytics, networkSymbol, vaultId, deviceStatus],
    );

    const reportWithdraw = useCallback(
        (payload: YieldWithdrawPayload) => {
            analytics.report({
                type: events.yieldWithdrawEvent.name,
                payload: {
                    networkSymbol,
                    vaultId,
                    ...payload,
                    ...(payload.action === 'continue' &&
                    ['withdraw', 'unwrap'].includes(payload.type)
                        ? { deviceStatus }
                        : {}),
                },
            });
        },
        [analytics, networkSymbol, vaultId, deviceStatus],
    );

    return { reportDeposit, reportInteraction, reportWithdraw };
};
