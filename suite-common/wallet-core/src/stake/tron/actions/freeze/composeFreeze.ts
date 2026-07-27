import { createThunk } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type Account,
    type PrecomposedLevels,
    type PrecomposedTransactionFinal,
    type TronResourceType,
} from '@suite-common/wallet-types';
import {
    asAmountUnit,
    computeBandwidthFeeLevel,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { buildFreezeContract } from './freezeContract';
import {
    TRON_DUMMY_BLOCK_HASH,
    TRON_DUMMY_BLOCK_HEIGHT,
    TRON_STAKE_MODULE,
} from '../../shared/constants';
import { type TronStakeError } from '../../tronStakeTypes';

export interface FreezeThunkArguments {
    account: Account;
    amount: string;
    resourceType: TronResourceType;
}

export const composeTronFreezeFeeLevelsThunk = createThunk<
    PrecomposedLevels,
    FreezeThunkArguments,
    { rejectValue: TronStakeError }
>(
    `${TRON_STAKE_MODULE}/composeTronFreezeFeeLevelsThunk`,
    async ({ account, amount, resourceType }, { rejectWithValue }) => {
        if (account.networkType !== 'tron') {
            return rejectWithValue({ kind: 'compose-failed', message: 'Invalid network type.' });
        }

        const amountValue = new BigNumber(amount);

        if (!amountValue.isFinite() || amountValue.lte(0)) {
            return rejectWithValue({ kind: 'compose-failed', message: 'Invalid amount.' });
        }

        const contract = buildFreezeContract(account, amount, resourceType);

        if (!contract) {
            return rejectWithValue({ kind: 'compose-failed', message: 'Invalid owner address.' });
        }

        const estimate = await TrezorConnect.tronComposeTransaction({
            contract,
            blockHash: TRON_DUMMY_BLOCK_HASH,
            blockHeight: TRON_DUMMY_BLOCK_HEIGHT,
        });

        if (!estimate.success) {
            return rejectWithValue({ kind: 'compose-failed', message: estimate.error.message });
        }

        const bytes = estimate.payload.bandwidth;

        const feeLevel = computeBandwidthFeeLevel({
            availableStakedBandwidth: account.misc.tronResources?.availableStakedBandwidth ?? 0,
            availableFreeBandwidth: account.misc.tronResources?.availableFreeBandwidth ?? 0,
            bytes,
        });

        const feeInSun = feeLevel.feePerTx || '0';
        const amountInSun = unitsToSubunits({
            value: asAmountUnit(new BigNumber(amount)),
            decimals: getNetwork(account.symbol).decimals,
        }).toString();

        const tx: PrecomposedTransactionFinal = {
            type: 'final',
            totalSpent: new BigNumber(amountInSun).plus(feeInSun).toString(),
            fee: feeInSun,
            feePerByte: feeLevel.feePerUnit ?? '0',
            bytes,
            inputs: [],
            outputs: [{ address: account.descriptor, amount: amountInSun }],
            outputsPermutation: [0],
        };

        return { normal: tx };
    },
);
