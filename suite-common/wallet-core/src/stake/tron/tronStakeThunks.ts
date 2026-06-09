import { createThunk } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type Account,
    type FormState,
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
import { tronStakeActions } from './tronStakeReducer';
import { type TronResourceType, type TronStakeError } from './tronStakeTypes';
import { addFakePendingTronTxThunk } from '../../transactions/transactionsThunks';

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

const buildFreezeReviewForm = (resourceType: TronResourceType): FormState => ({
    outputs: [],
    feePerUnit: '0',
    feeLimit: '',
    options: ['broadcast'],
    tronStakeResource: resourceType,
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
});

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
            outputs: [{ address: account.descriptor, amount: amountInSun }],
            outputsPermutation: [0],
        };

        return { normal: tx };
    },
);

interface SubmitFreezeThunkArguments extends FreezeThunkArguments {
    device: TrezorDevice;
    requestPushApproval: () => Promise<boolean>;
    onSigningStart?: () => void;
    onSettled?: () => void;
}

export const submitTronFreezeThunk = createThunk<void, SubmitFreezeThunkArguments>(
    `${TRON_STAKE_MODULE}/submitTronFreezeThunk`,
    async (
        { account, device, amount, resourceType, requestPushApproval, onSigningStart, onSettled },
        { dispatch },
    ) => {
        const { key: accountKey } = account;

        if (account.networkType !== 'tron') {
            dispatch(
                tronStakeActions.submitFinished({
                    accountKey,
                    error: { kind: 'compose-failed', message: 'Invalid network type.' },
                }),
            );

            return;
        }

        const contract = buildFreezeContract(account, amount, resourceType);

        if (!contract) {
            dispatch(
                tronStakeActions.submitFinished({
                    accountKey,
                    error: { kind: 'compose-failed', message: 'Invalid owner address.' },
                }),
            );

            return;
        }

        dispatch(tronStakeActions.submitStarted({ accountKey }));

        try {
            const composed = await dispatch(
                composeTronFreezeFeeLevelsThunk({ account, amount, resourceType }),
            )
                .unwrap()
                .catch(() => undefined);
            const precomposedTx = composed?.normal?.type === 'final' ? composed.normal : undefined;

            if (!precomposedTx) {
                dispatch(
                    tronStakeActions.submitFinished({
                        accountKey,
                        error: { kind: 'compose-failed' },
                    }),
                );

                return;
            }

            dispatch(
                tronStakeActions.storePrecomposedTransaction({
                    precomposedTx,
                    precomposedForm: buildFreezeReviewForm(resourceType),
                    accountKey,
                }),
            );

            onSigningStart?.();

            const signResult = await signTronContract({ account, device, contract });

            if ('error' in signResult) {
                dispatch(tronStakeActions.submitFinished({ accountKey, error: signResult.error }));

                return;
            }

            dispatch(
                tronStakeActions.storeSignedTransaction({
                    serializedTx: { tx: signResult.serializedTx, symbol: account.symbol },
                }),
            );

            const isPushApproved = await requestPushApproval();

            if (!isPushApproved) {
                dispatch(
                    tronStakeActions.submitFinished({ accountKey, error: { kind: 'cancelled' } }),
                );

                return;
            }

            const pushResult = await TrezorConnect.pushTransaction({
                tx: signResult.serializedTx,
                coin: account.symbol,
                identity: getAccountIdentity(account),
            });

            if (!pushResult.success) {
                dispatch(
                    tronStakeActions.submitFinished({
                        accountKey,
                        error: { kind: 'broadcast-failed', message: pushResult.error.message },
                    }),
                );

                return;
            }

            const { txid } = pushResult.payload;

            const stakeAmount = unitsToSubunits({
                value: asAmountUnit(new BigNumber(amount)),
                decimals: getNetwork(account.symbol).decimals,
            }).toString();

            dispatch(
                addFakePendingTronTxThunk({
                    account,
                    txid,
                    amount: '0',
                    fee: precomposedTx.fee ?? '0',
                    type: 'self',
                    target: { addresses: [account.descriptor], amount: stakeAmount },
                    tronSpecific: {
                        contractType: 'FreezeBalanceV2Contract',
                        operation: 'freeze',
                        resource: resourceType === 'energy' ? 'ENERGY' : 'BANDWIDTH',
                        stakeAmount,
                        bandwidthUsage: new BigNumber(precomposedTx.fee).isZero()
                            ? String(precomposedTx.bytes)
                            : undefined,
                    },
                }),
            );

            dispatch(tronStakeActions.submitFinished({ accountKey, txid }));
        } finally {
            onSettled?.();
            dispatch(tronStakeActions.discardTransaction());
        }
    },
);
