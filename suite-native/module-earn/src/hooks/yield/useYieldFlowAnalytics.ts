import { useCallback } from 'react';

import { type EventInstance, events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';

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
    const { analytics } = useServices(selectNativeAnalyticsDep);

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
                payload: { networkSymbol, vaultId, ...payload },
            });
        },
        [analytics, networkSymbol, vaultId],
    );

    const reportWithdraw = useCallback(
        (payload: YieldWithdrawPayload) => {
            analytics.report({
                type: events.yieldWithdrawEvent.name,
                payload: { networkSymbol, vaultId, ...payload },
            });
        },
        [analytics, networkSymbol, vaultId],
    );

    return { reportDeposit, reportInteraction, reportWithdraw };
};
