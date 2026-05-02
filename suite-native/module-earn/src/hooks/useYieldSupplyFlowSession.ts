import { useEffect } from 'react';
import { useDispatch, useStore } from 'react-redux';

import {
    type StablecoinYieldRootState,
    type StablecoinYieldSessionState,
    getStablecoinYieldSessionKey,
    selectStablecoinYield,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';

const flowType = 'supply' as const;

const getYieldSupplyFlowSession = (state: StablecoinYieldRootState, flowKey: string) =>
    selectStablecoinYield(state)[flowType][getStablecoinYieldSessionKey(flowKey)];

export const isYieldSupplyFlowSessionResumable = (
    session: StablecoinYieldSessionState | undefined,
): boolean => {
    if (!session) {
        return false;
    }

    return (
        session.action.pendingTransaction !== null ||
        session.action.isSubmitting ||
        session.approval.isSubmitting ||
        session.approval.modalState !== null
    );
};

export const useYieldSupplyFlowSession = (flowKey: string | null) => {
    const dispatch = useDispatch();
    const store = useStore<StablecoinYieldRootState>();

    useEffect(() => {
        if (!flowKey) {
            return;
        }

        const sessionParams = { flowType, flowKey };
        const entrySession = getYieldSupplyFlowSession(store.getState(), flowKey);

        dispatch(stablecoinYieldActions.initSession(sessionParams));

        if (entrySession && !isYieldSupplyFlowSessionResumable(entrySession)) {
            dispatch(stablecoinYieldActions.resetSession(sessionParams));
        }

        return () => {
            const exitSession = getYieldSupplyFlowSession(store.getState(), flowKey);

            if (!isYieldSupplyFlowSessionResumable(exitSession)) {
                dispatch(stablecoinYieldActions.disposeSession(sessionParams));
            }
        };
    }, [dispatch, flowKey, store]);
};
