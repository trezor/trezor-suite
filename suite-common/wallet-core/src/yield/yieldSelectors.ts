import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { createWeakMapSelector } from '@trezor/redux-utils';

import { type FeesRootState, selectConvertedNetworkFeeInfo } from '../fees/feesReducer';
import { isWrappedNativeFlowSupported } from './utils/yieldDeviceUtils';
import { getYieldGasReserve } from './utils/yieldGasReserve';
import {
    type YieldRootState,
    type YieldSessionState,
    type YieldTxReviewState,
    getYieldSessionKey,
    initialStablecoinYieldSessionState,
} from './yieldReducer';
import {
    YIELD_FLOW_TYPES,
    type YieldApproveModalState,
    type YieldFlowType,
    type YieldGasReserve,
} from './yieldTypes';

const createFeesMemoizedSelector = createWeakMapSelector.withTypes<FeesRootState>();

export const selectIsWrappedNativeFlowSupported = (state: DeviceRootState): boolean =>
    isWrappedNativeFlowSupported(selectSelectedDevice(state));

export const selectYield = (state: YieldRootState) => state.wallet.stablecoinYield;

export const selectYieldSessionByFlowKey = (
    state: YieldRootState,
    flowType: YieldFlowType,
    flowKey: string | null,
): YieldSessionState | null => {
    if (!flowKey) {
        return null;
    }

    return selectYield(state)[flowType][getYieldSessionKey(flowKey)] ?? null;
};

export const selectYieldSession = (
    state: YieldRootState,
    flowType: YieldFlowType,
    flowKey: string,
) => selectYieldSessionByFlowKey(state, flowType, flowKey) ?? initialStablecoinYieldSessionState;

export const selectYieldTxReview = (state: YieldRootState): YieldTxReviewState =>
    state.wallet.stablecoinYield.txReview;

/**
 * The send form handles both trading and yield approvals. The open yield modal identifies
 * the owner and approval type without decoding calldata.
 */
export const selectYieldApprovalInReview = (state: YieldRootState): YieldApproveModalState | null =>
    YIELD_FLOW_TYPES.flatMap(flowType => Object.values(selectYield(state)[flowType])).find(
        session => session.approval.modalState !== null,
    )?.approval.modalState ?? null;

export const selectIsYieldTransactionInReview = (state: YieldRootState): boolean =>
    !!selectYieldTxReview(state).precomposedTx || !!selectYieldApprovalInReview(state);

export const selectYieldGasReserve = createFeesMemoizedSelector(
    [
        selectConvertedNetworkFeeInfo,
        (
            _state: FeesRootState,
            _symbol: NetworkSymbol | undefined,
            isWrappedNativeVault: boolean,
        ) => isWrappedNativeVault,
        (
            _state: FeesRootState,
            _symbol: NetworkSymbol | undefined,
            _isWrappedNativeVault: boolean,
            tokenContractAddress?: string | null,
        ) => tokenContractAddress,
    ],
    (feeInfo, isWrappedNativeVault, tokenContractAddress): YieldGasReserve | null =>
        getYieldGasReserve({
            feeLevel: feeInfo?.levels.find(level => level.label === 'normal'),
            isWrappedNativeVault,
            tokenContractAddress,
        }),
);
