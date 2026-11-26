import { useCallback, useEffect, useRef } from 'react';

import { injectDesktopAnalytics } from '@suite/analytics';
import { type Route, goBackThunk, selectRouteName } from '@suite/router';
import { type EventInstance, events } from '@suite-common/analytics';
import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { getResolvedYieldFlowData, selectYieldSessionByFlowKey } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch, injectGetState } from '@trezor/redux-utils';

import { useSelector } from '#src/hooks/suite/useSelector';

type ExitPayload = EventInstance<typeof events.yieldNavigateEvent>['payload'];

const getExitDestination = (routeName: Route['name'] | undefined): ExitPayload['to'] | null => {
    switch (routeName) {
        case 'suite-earn':
            return 'earn-dashboard';
        case 'earn-yield-vault':
            return 'vault-detail';
        default:
            return null;
    }
};

type UseYieldBackNavigationParams = {
    flowType?: 'deposit' | 'withdraw' | 'claim';
    account?: Account;
    vault?: YieldDtoV2;
};

export const useYieldBackNavigation = ({
    flowType,
    account,
    vault,
}: UseYieldBackNavigationParams) => {
    const { analytics, dispatch, getState } = useServices(
        injectDesktopAnalytics,
        injectDispatch,
        injectGetState,
    );
    const networkSymbol = account?.symbol;
    const vaultId = vault?.id;
    const resolvedFlowKey = getResolvedYieldFlowData({ account, vault }).flowKey;
    const flowKey = flowType === 'claim' ? account?.key : resolvedFlowKey;
    const isComplete = useSelector(
        state =>
            !!flowType &&
            !!flowKey &&
            (selectYieldSessionByFlowKey(state, flowType, flowKey)?.step === 'complete' ||
                (flowType === 'withdraw' &&
                    selectYieldSessionByFlowKey(state, 'redeem', flowKey)?.step === 'complete')),
    );
    const exitPayloadRef = useRef<Omit<ExitPayload, 'to'> | null>(null);

    // Keep the last resolved flow before navigation can dispose its session or header context.
    useEffect(() => {
        if (!flowType || selectRouteName(getState()) !== `earn-yield-${flowType}`) return;

        exitPayloadRef.current = flowKey
            ? {
                  action: isComplete ? 'continue' : 'cancel',
                  from: `${flowType}-form`,
                  networkSymbol,
                  ...(vaultId && { vaultId }),
              }
            : null;
    }, [flowKey, flowType, getState, isComplete, networkSymbol, vaultId]);

    useEffect(
        () => () => {
            const to = getExitDestination(selectRouteName(getState()));
            const exitPayload = exitPayloadRef.current;

            if (!to || !exitPayload) return;

            analytics.report({
                type: events.yieldNavigateEvent.name,
                payload: {
                    action: exitPayload.action,
                    from: exitPayload.from,
                    to,
                    networkSymbol: exitPayload.networkSymbol,
                    ...(exitPayload.vaultId && { vaultId: exitPayload.vaultId }),
                },
            });
        },
        [analytics, getState],
    );

    return useCallback(
        () => dispatch(goBackThunk({ fallback: { routeName: 'suite-earn' } })),
        [dispatch],
    );
};
