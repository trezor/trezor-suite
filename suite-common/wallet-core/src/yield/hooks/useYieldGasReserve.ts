import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { type FeesRootState } from '../../fees/feesReducer';
import { FALLBACK_YIELD_GAS_RESERVE } from '../utils/yieldGasReserve';
import { type YieldRootState, yieldActions } from '../yieldReducer';
import { selectYieldGasReserve, selectYieldSessionByFlowKey } from '../yieldSelectors';
import { type YieldFlowType, type YieldGasReserve } from '../yieldTypes';

type UseYieldGasReserveParams = {
    networkSymbol: NetworkSymbol;
    isWrappedNativeVault: boolean;
    tokenContractAddress?: string | null;
    /** Given together with `flowKey`, the reserve is frozen into that yield session. */
    flowType?: YieldFlowType;
    flowKey?: string | null;
};

export const useYieldGasReserve = ({
    networkSymbol,
    isWrappedNativeVault,
    tokenContractAddress,
    flowType,
    flowKey,
}: UseYieldGasReserveParams): YieldGasReserve => {
    const { dispatch } = useServices(injectDispatch);

    const liveReserve = useSelector((state: FeesRootState) =>
        selectYieldGasReserve(state, networkSymbol, isWrappedNativeVault, tokenContractAddress),
    );

    const session = useSelector((state: YieldRootState) =>
        flowType && flowKey ? selectYieldSessionByFlowKey(state, flowType, flowKey) : null,
    );

    const hasSession = session !== null;
    const frozenReserve = session?.gasReserve ?? null;

    const [latchedReserve, setLatchedReserve] = useState<YieldGasReserve | null>(null);

    useEffect(() => {
        if (!liveReserve) return;

        if (flowType && flowKey) {
            if (hasSession && !frozenReserve) {
                dispatch(
                    yieldActions.freezeGasReserve({ flowType, flowKey, gasReserve: liveReserve }),
                );
            }

            return;
        }

        setLatchedReserve(current => current ?? liveReserve);
    }, [dispatch, flowKey, flowType, frozenReserve, hasSession, liveReserve]);

    return frozenReserve ?? latchedReserve ?? liveReserve ?? FALLBACK_YIELD_GAS_RESERVE;
};
