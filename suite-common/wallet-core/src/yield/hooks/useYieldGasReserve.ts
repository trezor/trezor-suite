import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type FeeInfo } from '@suite-common/wallet-types';

import {
    type FeesRootState,
    selectNetworkFeeStatus,
    selectRawNetworkFeeInfo,
} from '../../fees/feesReducer';
import { FALLBACK_YIELD_GAS_RESERVE } from '../utils/yieldGasReserve';
import { type YieldRootState, yieldActions } from '../yieldReducer';
import { selectYieldGasReserve, selectYieldSessionByFlowKey } from '../yieldSelectors';
import { type YieldFlowType, type YieldGasReserve } from '../yieldTypes';

type UseYieldGasReserveParams = {
    networkSymbol: NetworkSymbol | undefined;
    isWrappedNativeVault: boolean;
    tokenContractAddress?: string | null;
    /** Given together with `flowKey`, the reserve is frozen into that yield session. */
    flowType?: YieldFlowType;
    flowKey?: string | null;
};

type MountState = {
    key: string;
    feeInfo: FeeInfo | undefined;
};

type LatchState = {
    key: string;
    reserve: YieldGasReserve | null;
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
    const feeStatus = useSelector((state: FeesRootState) =>
        selectNetworkFeeStatus(state, networkSymbol),
    );
    const feeInfo = useSelector((state: FeesRootState) =>
        selectRawNetworkFeeInfo(state, networkSymbol),
    );

    const isSessionMode = Boolean(flowType && flowKey);
    const session = useSelector((state: YieldRootState) =>
        flowType && flowKey ? selectYieldSessionByFlowKey(state, flowType, flowKey) : null,
    );

    const hasSession = session !== null;
    const frozenReserve = session?.gasReserve ?? null;

    // the component may stay mounted while its account, network or session changes, so
    // the per-mount state is scoped to the inputs and starts over whenever they change
    const inputsKey = [
        networkSymbol,
        isWrappedNativeVault,
        tokenContractAddress ?? '',
        isSessionMode ? `${flowType}:${flowKey}` : '',
    ].join('|');

    const [mountState, setMountState] = useState<MountState>({ key: inputsKey, feeInfo });

    useEffect(() => {
        if (mountState.key === inputsKey) return;
        setMountState({ key: inputsKey, feeInfo });
    }, [mountState.key, inputsKey, feeInfo]);

    const feeInfoAtMount = mountState.key === inputsKey ? mountState.feeInfo : feeInfo;
    const isFetchedAfterMount = feeStatus === 'loaded' && feeInfo !== feeInfoAtMount;
    const fetchedReserve = isFetchedAfterMount ? liveReserve : null;

    const [latchState, setLatchState] = useState<LatchState>({ key: inputsKey, reserve: null });
    const latchedReserve = latchState.key === inputsKey ? latchState.reserve : null;

    useEffect(() => {
        if (!fetchedReserve) return;

        if (flowType && flowKey) {
            if (hasSession && !frozenReserve) {
                dispatch(
                    yieldActions.freezeGasReserve({
                        flowType,
                        flowKey,
                        gasReserve: fetchedReserve,
                    }),
                );
            }

            return;
        }

        setLatchState(current =>
            current.key === inputsKey && current.reserve
                ? current
                : { key: inputsKey, reserve: fetchedReserve },
        );
    }, [dispatch, fetchedReserve, flowKey, flowType, frozenReserve, hasSession, inputsKey]);

    return frozenReserve ?? latchedReserve ?? liveReserve ?? FALLBACK_YIELD_GAS_RESERVE;
};
