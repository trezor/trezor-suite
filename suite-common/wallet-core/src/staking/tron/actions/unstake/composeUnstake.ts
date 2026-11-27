import { getNetwork } from '@suite-common/wallet-config';
import {
    type Account,
    type PrecomposedLevels,
    type TronResourceType,
} from '@suite-common/wallet-types';
import { asAmountUnit, unitsToSubunits } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { createThunk } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import { buildUnstakeContract } from './unstakeContract';
import { composeTronStakingFeeLevels } from '../../shared/composeTronStakingFeeLevels';
import {
    TRON_DUMMY_BLOCK_HASH,
    TRON_DUMMY_BLOCK_HEIGHT,
    TRON_STAKE_MODULE,
} from '../../shared/constants';
import { type TronStakeError } from '../../tronStakingTypes';

export interface UnstakeThunkArguments {
    account: Account;
    amount: string;
    resourceType: TronResourceType;
}

export const composeTronUnstakeFeeLevelsThunk = createThunk<
    PrecomposedLevels,
    UnstakeThunkArguments,
    { rejectValue: TronStakeError }
>(
    `${TRON_STAKE_MODULE}/composeTronUnstakeFeeLevelsThunk`,
    async ({ account, amount, resourceType }, { rejectWithValue }) => {
        if (account.networkType !== 'tron') {
            return rejectWithValue({ kind: 'compose-failed', message: 'Invalid network type.' });
        }

        const amountValue = new BigNumber(amount);

        if (!amountValue.isFinite() || amountValue.lte(0)) {
            return rejectWithValue({ kind: 'compose-failed', message: 'Invalid amount.' });
        }

        const contract = buildUnstakeContract(account, amount, resourceType);

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

        const amountInSun = unitsToSubunits({
            value: asAmountUnit(new BigNumber(amount)),
            decimals: getNetwork(account.symbol).decimals,
        }).toString();

        return composeTronStakingFeeLevels({
            account,
            bytes: estimate.payload.bandwidth,
            amount: amountInSun,
        });
    },
);
