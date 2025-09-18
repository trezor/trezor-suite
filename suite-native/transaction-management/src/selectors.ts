import { createWeakMapSelector } from '@suite-common/redux-utils';
import { GeneralPrecomposedTransaction } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import { NativeSendRootState } from './sendFormSlice';
import { NativeSupportedFeeLevel } from './types';

const createMemoizedSelector = createWeakMapSelector.withTypes<NativeSendRootState>();

export const selectFeeLevels = (state: NativeSendRootState) => state.wallet.send.feeLevels;
export const selectCustomFeeLevel = (
    state: NativeSendRootState,
): GeneralPrecomposedTransaction | undefined => state.wallet.send.feeLevels.custom;

export const selectFeeLevelTransactionBytes = createMemoizedSelector(
    [
        selectFeeLevels,
        (_state: NativeSendRootState, feeLevelLabel: NativeSupportedFeeLevel) => feeLevelLabel,
    ],
    (feeLevels, feeLevelLabel) => {
        const feeLevel = feeLevels[feeLevelLabel];
        if (feeLevel && feeLevel.type !== 'error') {
            const { bytes, fee, feePerByte, feeLimit } = feeLevel;
            if (bytes !== 0) {
                return feeLevel.bytes;
            }

            // Ethereum-based fee level does not have bytes stored as attribute
            // so we need to calculate it from fee, feePerByte and feeLimit.
            if (fee && feePerByte && feeLimit) {
                return BigNumber(fee).div(feePerByte).div(feeLimit).toNumber();
            }
        }

        return 0;
    },
);
