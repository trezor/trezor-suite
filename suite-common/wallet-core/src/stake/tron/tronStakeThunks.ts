import { createThunk } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type Account,
    type PrecomposedLevels,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import {
    asAmountUnit,
    computeBandwidthFeeLevel,
    getAccountIdentity,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import { tronUtils } from '@trezor/blockchain-link-utils';
import TrezorConnect from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { signTronContract } from './signTronContract';
import { buildFreezeBalanceV2Contract } from './tronStakeContracts';
import { type TronResourceType, type TronStakeError } from './tronStakeTypes';

const TRON_STAKE_MODULE = '@common/wallet-core/tron-stake';

const DUMMY_BLOCK_HASH = '0'.repeat(64);
const DUMMY_BLOCK_HEIGHT = 0;

interface FreezeThunkArguments {
    account: Account;
    amount: string;
    resourceType: TronResourceType;
}

const buildFreezeContract = (account: Account, amount: string, resourceType: TronResourceType) => {
    const ownerHex = tronUtils.tronAddressToHex(account.descriptor);

    if (!ownerHex) {
        return null;
    }

    const balance = unitsToSubunits({
        value: asAmountUnit(new BigNumber(amount)),
        decimals: getNetwork(account.symbol).decimals,
    }).toNumber();

    return buildFreezeBalanceV2Contract({
        ownerHex,
        balance,
        resourceType,
    });
};

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

        const contract = buildFreezeContract(account, amount, resourceType);

        if (!contract) {
            return rejectWithValue({ kind: 'compose-failed', message: 'Invalid owner address.' });
        }

        const estimate = await TrezorConnect.tronComposeTransaction({
            contract,
            blockHash: DUMMY_BLOCK_HASH,
            blockHeight: DUMMY_BLOCK_HEIGHT,
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
            outputs: [],
            outputsPermutation: [],
        };

        return { normal: tx };
    },
);

export const submitTronFreezeThunk = createThunk<
    { txid: string },
    FreezeThunkArguments & { device: TrezorDevice },
    { rejectValue: TronStakeError }
>(
    `${TRON_STAKE_MODULE}/submitTronFreezeThunk`,
    async ({ account, device, amount, resourceType }, { rejectWithValue }) => {
        if (account.networkType !== 'tron') {
            return rejectWithValue({ kind: 'compose-failed', message: 'Invalid network type.' });
        }

        const contract = buildFreezeContract(account, amount, resourceType);

        if (!contract) {
            return rejectWithValue({ kind: 'compose-failed', message: 'Invalid owner address.' });
        }

        const signResult = await signTronContract({ account, device, contract });

        if ('error' in signResult) {
            return rejectWithValue(signResult.error);
        }

        const pushResult = await TrezorConnect.pushTransaction({
            tx: signResult.serializedTx,
            coin: account.symbol,
            identity: getAccountIdentity(account),
        });

        if (!pushResult.success) {
            return rejectWithValue({ kind: 'broadcast-failed', message: pushResult.error.message });
        }

        return { txid: pushResult.payload.txid };
    },
);
