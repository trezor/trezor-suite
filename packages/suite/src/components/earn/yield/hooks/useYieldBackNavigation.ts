import { useCallback, useEffect, useRef } from 'react';

import { injectDesktopAnalytics } from '@suite/analytics';
import { gotoThunk, selectRouteName } from '@suite/router';
import { type EventInstance, events } from '@suite-common/analytics';
import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { getResolvedYieldFlowData, selectYieldSessionByFlowKey } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch, injectGetState } from '@trezor/redux-utils';

import { useSelector } from 'src/hooks/suite';

type UseYieldBackNavigationParams = {
    flowType: 'deposit' | 'withdraw' | 'claim';
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
    const flowKey =
        flowType === 'claim' ? account?.key : getResolvedYieldFlowData({ account, vault }).flowKey;
    const isComplete = useSelector(
        state =>
            !!flowKey &&
            (selectYieldSessionByFlowKey(state, flowType, flowKey)?.step === 'complete' ||
                (flowType === 'withdraw' &&
                    selectYieldSessionByFlowKey(state, 'redeem', flowKey)?.step === 'complete')),
    );
    const exitPayloadRef = useRef<
        EventInstance<typeof events.yieldNavigateEvent>['payload'] | null
    >(null);

    // Keep the last resolved flow before navigation can dispose its session or header context.
    useEffect(() => {
        if (selectRouteName(getState()) !== `earn-yield-${flowType}`) return;

        exitPayloadRef.current = flowKey
            ? {
                  action: isComplete ? 'continue' : 'cancel',
                  from: `${flowType}-form`,
                  to: 'earn-dashboard',
                  networkSymbol,
                  ...(vaultId && { vaultId }),
              }
            : null;
    }, [flowKey, flowType, getState, isComplete, networkSymbol, vaultId]);

    useEffect(
        () => () => {
            if (selectRouteName(getState()) === 'suite-earn' && exitPayloadRef.current) {
                analytics.report({
                    type: events.yieldNavigateEvent.name,
                    payload: exitPayloadRef.current,
                });
            }
        },
        [analytics, getState],
    );

    return useCallback(() => dispatch(gotoThunk({ routeName: 'suite-earn' })), [dispatch]);
};
