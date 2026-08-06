import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getNetwork } from '@suite-common/wallet-config';
import { type PrecomposedLevels } from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    asAmountUnit,
    computeBandwidthFeeLevel,
    getAccountIdentity,
    getExternalComposeOutput,
    subunitsToUnits,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import * as tronUtils from '@trezor/network-tron/utils';
import { BigNumber } from '@trezor/utils';

import { SEND_MODULE_PREFIX } from '../sendFormConstants';
import {
    type ComposeFeeLevelsError,
    type ComposeTransactionThunkArguments,
    type SignTransactionError,
    type SignTransactionThunkArguments,
} from '../sendFormTypes';
import { buildTransferContract, buildTriggerContract } from './buildContract';
import { calculate } from './calculate';
import { estimateContractCallFeeLevel } from './feeLevel';
import { isNewTronAccount } from './isNewTronAccount';
import { resolveCalldata } from './resolveCalldata';

type ComposeTronTransactionFeeLevelsThunkState = void;

export const composeTronTransactionFeeLevelsThunk = createThunk<
    PrecomposedLevels,
    ComposeTransactionThunkArguments,
    { rejectValue: ComposeFeeLevelsError; state: ComposeTronTransactionFeeLevelsThunkState }
>(
    `${SEND_MODULE_PREFIX}/composeTronTransactionFeeLevelsThunk`,
    async ({ formState, composeContext }, { dispatch, rejectWithValue }) => {
        const { account, network } = composeContext;

        if (account.networkType !== 'tron') {
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: 'Invalid network type.',
            });
        }

        const composeOutputs = getExternalComposeOutput(formState, account, network);

        if (!composeOutputs) {
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: 'Unable to compose output.',
            });
        }

        const { output, tokenInfo: token, decimals } = composeOutputs;
        const to =
            'address' in output && output.address
                ? output.address
                : (composeContext.feeEstimationRecipient ?? account.descriptor);

        const isSendMax = output.type === 'send-max' || output.type === 'send-max-noaddress';
        const fallbackAmount = token
            ? unitsToSubunits({
                  value: asAmountUnit(new BigNumber(token.balance ?? '0')),
                  decimals: token.decimals,
              }).toString()
            : account.availableBalance;
        const amountForEstimation =
            isSendMax || !('amount' in output) || !output.amount ? fallbackAmount : output.amount;

        const ownerHex = tronUtils.tronAddressToHex(account.descriptor);
        const recipientHex = token
            ? tronUtils.tronAddressToHex(token.contract)
            : tronUtils.tronAddressToHex(to);

        if (!ownerHex || !recipientHex) {
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: 'Invalid address checksum.',
            });
        }

        // Dummy block values — block fields are fixed-size in protobuf so bandwidth is identical
        // to what we'd get with real block data.
        const DUMMY_BLOCK_HASH = '0'.repeat(64);
        const DUMMY_BLOCK_HEIGHT = 0;

        const userCallDataHex = formState.transactionData
            ? formState.transactionData.replace(/^0x/, '')
            : '';

        const calldata = resolveCalldata({
            token,
            outputAddress: to,
            amountInSubunits: amountForEstimation,
            userCallDataHex,
        });

        if ('error' in calldata) {
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: calldata.error,
            });
        }

        const contract =
            calldata.data !== null
                ? buildTriggerContract({ ownerHex, recipientHex, data: calldata.data })
                : buildTransferContract({ ownerHex, recipientHex, amount: amountForEstimation });

        const noteHex = formState.destinationTag
            ? Buffer.from(formState.destinationTag, 'utf8').toString('hex')
            : undefined;

        const bandwidthEstimate = await TrezorConnect.tronComposeTransaction({
            contract,
            blockHash: DUMMY_BLOCK_HASH,
            blockHeight: DUMMY_BLOCK_HEIGHT,
            data: noteHex || undefined,
        });

        if (!bandwidthEstimate.success) {
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: bandwidthEstimate.error.message,
            });
        }

        const bytes = bandwidthEstimate.payload.bandwidth;

        const [firstComposeOutput] = formState.outputs;

        if (!firstComposeOutput) {
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: 'Missing transaction output.',
            });
        }

        const isNewAccount =
            calldata.data === null &&
            to !== account.descriptor &&
            (await isNewTronAccount(to, account));

        const feeLevel =
            calldata.data !== null
                ? await estimateContractCallFeeLevel({
                      symbol: account.symbol,
                      identity: getAccountIdentity(account),
                      from: account.descriptor,
                      to: token ? token.contract : to,
                      data: calldata.data,
                  })
                : computeBandwidthFeeLevel({
                      availableStakedBandwidth:
                          account.misc?.tronResources?.availableStakedBandwidth ?? 0,
                      availableFreeBandwidth:
                          account.misc?.tronResources?.availableFreeBandwidth ?? 0,
                      bytes,
                      isNewAccount,
                  });

        if ('error' in feeLevel) {
            dispatch(notificationsActions.addToast({ type: 'estimated-fee-error' }));

            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: feeLevel.error,
            });
        }

        const tx = calculate(
            account.availableBalance,
            output,
            feeLevel,
            account.symbol,
            bytes,
            noteHex !== undefined,
            token,
            isNewAccount,
            userCallDataHex,
        );

        if (tx.type !== 'error' && tx.max !== undefined) {
            tx.max = subunitsToUnits({
                value: asAmountSubunit(new BigNumber(tx.max)),
                decimals,
            }).toString();
        }

        if (calldata.data !== null && tx.type !== 'error') {
            tx.estimatedFeeLimit = tx.fee;
        }

        return { normal: tx };
    },
);

type SignTronSendFormTransactionThunkState = void;

export const signTronSendFormTransactionThunk = createThunk<
    { serializedTx: string },
    SignTransactionThunkArguments,
    { rejectValue: SignTransactionError; state: SignTronSendFormTransactionThunkState }
>(
    `${SEND_MODULE_PREFIX}/signTronSendFormTransactionThunk`,
    async ({ formState, precomposedTransaction, selectedAccount, device }, { rejectWithValue }) => {
        if (selectedAccount.networkType !== 'tron') {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Invalid network type.',
            });
        }

        const blockchainInfo = await TrezorConnect.blockchainGetInfo({
            coin: asCoinSymbol(selectedAccount.symbol),
            identity: getAccountIdentity(selectedAccount),
        });
        if (!blockchainInfo.success) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Failed to fetch blockchain info.',
            });
        }

        const { blockHash, blockHeight } = blockchainInfo.payload;
        const { token } = precomposedTransaction;
        const [output] = formState.outputs;

        if (!output) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Missing transaction output.',
            });
        }

        const network = getNetwork(selectedAccount.symbol);
        const amountInSubunits = unitsToSubunits({
            value: asAmountUnit(new BigNumber(output.amount)),
            decimals: token ? token.decimals : network.decimals,
        }).toString();

        const userCallDataHex = formState.transactionData
            ? formState.transactionData.replace(/^0x/, '')
            : '';

        const feeLimitSource = formState.feeLimit || precomposedTransaction.fee;
        const feeLimitSun =
            (token || userCallDataHex) && feeLimitSource ? Number(feeLimitSource) : undefined;

        const ownerHex = tronUtils.tronAddressToHex(selectedAccount.descriptor);
        const recipientHex = token
            ? tronUtils.tronAddressToHex(token.contract)
            : tronUtils.tronAddressToHex(output.address);

        if (!ownerHex || !recipientHex) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Invalid address checksum.',
            });
        }

        const calldata = resolveCalldata({
            token,
            outputAddress: output.address,
            amountInSubunits,
            userCallDataHex,
        });

        if ('error' in calldata) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: calldata.error,
            });
        }

        const contract =
            calldata.data !== null
                ? buildTriggerContract({ ownerHex, recipientHex, data: calldata.data })
                : buildTransferContract({ ownerHex, recipientHex, amount: amountInSubunits });

        const noteHex = formState.destinationTag
            ? Buffer.from(formState.destinationTag, 'utf8').toString('hex')
            : undefined;

        const composed = await TrezorConnect.tronComposeTransaction({
            contract,
            blockHash,
            blockHeight,
            fee_limit: feeLimitSun,
            data: noteHex || undefined,
        });

        if (!composed.success) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: composed.error.message,
            });
        }

        const { ref_block_bytes, ref_block_hash, expiration, timestamp } = composed.payload;

        const signed = await TrezorConnect.tronSignTransaction({
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
                useEmptyPassphrase: device.useEmptyPassphrase,
            },
            path: selectedAccount.path,
            ref_block_bytes,
            ref_block_hash,
            expiration,
            timestamp,
            fee_limit: feeLimitSun,
            data: noteHex || undefined,
            contract: [contract],
        });

        if (!signed.success) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: signed.error.message,
            });
        }

        if (!signed.payload.serializedTx) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Failed to serialize transaction.',
            });
        }

        return { serializedTx: signed.payload.serializedTx };
    },
);
