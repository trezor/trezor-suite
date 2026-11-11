import { useCallback, useContext, useEffect } from 'react';

import { useIsFocused } from '@react-navigation/native';

import { type EventInstance, events } from '@suite-common/analytics';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type YieldPositionFlowType } from '@suite-common/wallet-core';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { useServices } from '@trezor/dependency-injection';

import { YieldFlowExitAnalyticsContext } from '../../contexts/YieldFlowExitAnalyticsContext';
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

type UseYieldFormExitAnalyticsParams = {
    flowType: YieldPositionFlowType;
    networkSymbol?: NetworkSymbol;
    vaultId?: string;
    isEnabled: boolean;
    isCompleted?: boolean;
};

export const useYieldFormExitAnalytics = ({
    flowType,
    networkSymbol,
    vaultId,
    isEnabled,
    isCompleted = false,
}: UseYieldFormExitAnalyticsParams) => {
    const trackFlow = useContext(YieldFlowExitAnalyticsContext);
    const isFocused = useIsFocused();

    useEffect(() => {
        if (isEnabled && (isFocused || isCompleted)) {
            trackFlow?.({ flowType, networkSymbol, vaultId, isCompleted });
        }
    }, [flowType, networkSymbol, vaultId, isCompleted, isEnabled, isFocused, trackFlow]);
};
