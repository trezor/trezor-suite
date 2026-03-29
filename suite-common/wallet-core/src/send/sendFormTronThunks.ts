import { Calldata } from '@suite-common/calldata';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type NetworkSymbol,
    getNetwork,
    getNetworkDisplaySymbol,
} from '@suite-common/wallet-config';
import {
    type ExternalOutput,
    type PrecomposedLevels,
    type PrecomposedTransaction,
} from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    asAmountUnit,
    calculateMax,
    calculateTotal,
    getAccountIdentity,
    getExternalComposeOutput,
    subunitsToUnits,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import { type BlockchainLinkResponse } from '@trezor/blockchain-link';
import { tronUtils } from '@trezor/blockchain-link-utils';
import TrezorConnect, { type TokenInfo } from '@trezor/connect';
import {
    encodeBroadcastTransaction,
    estimateTronTransferBandwidth,
    estimateTronTrc20Bandwidth,
} from '@trezor/connect/src/api/tron/tronProtobuf';
import { BigNumber } from '@trezor/utils';

import { SEND_MODULE_PREFIX } from './sendFormConstants';
import {
    type ComposeFeeLevelsError,
    type ComposeTransactionThunkArguments,
    type SignTransactionError,
    type SignTransactionThunkArguments,
} from './sendFormTypes';

type EstimateFeeLevel = BlockchainLinkResponse<'estimateFee'>[number];

export const getTronEstimateFeeParams = (
    to: string,
    amountInSubunits: string,
    token?: TokenInfo,
) => {
    if (token) {
        const result = Calldata.tron.trc20.transfer({
            to,
            amount: new BigNumber(amountInSubunits),
        });

        return {
            to: token.contract,
            value: '0x0',
            data: result.data ?? '',
        };
    }

    return {
        to,
        value: `0x${new BigNumber(amountInSubunits).toString(16)}`,
    };
};

const calculateTrc20Transfer = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: EstimateFeeLevel,
    token: TokenInfo,
    networkSymbol: NetworkSymbol,
): PrecomposedTransaction => {
    const totalFeeInSun = feeLevel.feePerTx || '0';
    const isSendMax = output.type === 'send-max' || output.type === 'send-max-noaddress';

    const tokenBalanceInSubunits = unitsToSubunits({
        value: asAmountUnit(new BigNumber(token.balance ?? '0')),
        decimals: token.decimals,
    }).toString();
    const outputAmount = 'amount' in output ? (output.amount ?? '0') : '0';
    const amount = isSendMax ? tokenBalanceInSubunits : outputAmount;
    const max = isSendMax ? amount : undefined;

    if (new BigNumber(totalFeeInSun).isGreaterThan(availableBalance)) {
        return {
            type: 'error',
            error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
            errorMessage: {
                id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
                values: {
                    networkDisplaySymbol: getNetworkDisplaySymbol(networkSymbol),
                },
            },
        } as const;
    }

    const energyConsumed =
        feeLevel.feePerTx && feeLevel.feePerUnit && !new BigNumber(feeLevel.feePerUnit).isZero()
            ? new BigNumber(feeLevel.feePerTx).dividedToIntegerBy(feeLevel.feePerUnit).toNumber()
            : 0;
    const payloadData = {
        type: 'nonfinal' as const,
        totalSpent: amount,
        max,
        fee: totalFeeInSun,
        feePerByte: feeLevel.feePerUnit,
        feeLimit: feeLevel.feeLimit, // energy cap in energy units; fee_limit in the signed tx uses the equivalent in SUN (feeLimit × feePerUnit)
        energyConsumed,
        bytes: estimateTronTrc20Bandwidth(totalFeeInSun),
        inputs: [],
        token,
    };

    if (output.type === 'send-max' || output.type === 'payment') {
        return {
            ...payloadData,
            type: 'final',
            inputs: [],
            outputsPermutation: [0],
            outputs: [{ address: output.address, amount, script_type: 'PAYTOADDRESS' }],
        };
    }

    return payloadData;
};

const calculateTrxTransfer = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: EstimateFeeLevel,
): PrecomposedTransaction => {
    const totalFeeInSun = feeLevel.feePerTx || '0';
    const isSendMax = output.type === 'send-max' || output.type === 'send-max-noaddress';

    let amount: string;
    let max: string | undefined;

    if (isSendMax) {
        max = calculateMax(availableBalance, totalFeeInSun);
        amount = max;
    } else {
        amount = 'amount' in output ? output.amount : '0';
    }

    if (new BigNumber(calculateTotal(amount, totalFeeInSun)).isGreaterThan(availableBalance)) {
        return {
            type: 'error',
            error: 'AMOUNT_IS_NOT_ENOUGH',
            errorMessage: { id: 'AMOUNT_IS_NOT_ENOUGH' },
        } as const;
    }

    const payloadData = {
        type: 'nonfinal' as const,
        totalSpent: calculateTotal(amount, totalFeeInSun),
        max,
        fee: totalFeeInSun,
        feePerByte: feeLevel.feePerUnit,
        bytes: estimateTronTransferBandwidth(amount),
        inputs: [],
    };

    if (output.type === 'send-max' || output.type === 'payment') {
        return {
            ...payloadData,
            type: 'final',
            inputs: [],
            outputsPermutation: [0],
            outputs: [{ address: output.address, amount, script_type: 'PAYTOADDRESS' }],
        };
    }

    return payloadData;
};

const calculate = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: EstimateFeeLevel,
    networkSymbol: NetworkSymbol,
    token?: TokenInfo,
): PrecomposedTransaction =>
    token
        ? calculateTrc20Transfer(availableBalance, output, feeLevel, token, networkSymbol)
        : calculateTrxTransfer(availableBalance, output, feeLevel);

export const composeTronTransactionFeeLevelsThunk = createThunk<
    PrecomposedLevels,
    ComposeTransactionThunkArguments,
    { rejectValue: ComposeFeeLevelsError }
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

        const { output, tokenInfo, decimals } = composeOutputs;
        const to = 'address' in output && output.address ? output.address : account.descriptor;

        const isSendMax = output.type === 'send-max' || output.type === 'send-max-noaddress';
        const fallbackAmount = tokenInfo
            ? unitsToSubunits({
                  value: asAmountUnit(new BigNumber(tokenInfo.balance ?? '0')),
                  decimals: tokenInfo.decimals,
              }).toString()
            : account.availableBalance;
        const amountForEstimation =
            isSendMax || !('amount' in output) || !output.amount ? fallbackAmount : output.amount;

        let feeLevel: EstimateFeeLevel;

        if (tokenInfo) {
            const estimateFeeParams = getTronEstimateFeeParams(to, amountForEstimation, tokenInfo);
            const estimatedFee = await TrezorConnect.blockchainEstimateFee({
                coin: account.symbol,
                identity: getAccountIdentity(account),
                request: {
                    blocks: [1],
                    specific: { from: account.descriptor, ...estimateFeeParams },
                },
            });

            if (!estimatedFee.success) {
                dispatch(notificationsActions.addToast({ type: 'estimated-fee-error' }));

                return rejectWithValue({
                    error: 'fee-levels-compose-failed',
                    message: estimatedFee.error.message,
                });
            }

            feeLevel = estimatedFee.payload.levels[0];
        } else {
            const bytes = estimateTronTransferBandwidth(amountForEstimation);
            const availableBandwidth = Math.max(
                account.misc?.tronResources?.availableStakedBandwidth ?? 0,
                account.misc?.tronResources?.availableFreeBandwidth ?? 0,
            );
            const feeInSun =
                availableBandwidth < bytes ? bytes * tronUtils.TRON_BANDWIDTH_SUN_PRICE : 0;

            feeLevel = {
                feePerTx: String(feeInSun),
                feePerUnit: String(tronUtils.TRON_BANDWIDTH_SUN_PRICE),
            };
        }

        const tx = calculate(account.availableBalance, output, feeLevel, account.symbol, tokenInfo);

        if (tx.type !== 'error' && tx.max !== undefined) {
            tx.max = subunitsToUnits({
                value: asAmountSubunit(new BigNumber(tx.max)),
                decimals,
            }).toString();
        }

        return { normal: tx };
    },
);

export const signTronSendFormTransactionThunk = createThunk<
    { serializedTx: string },
    SignTransactionThunkArguments,
    { rejectValue: SignTransactionError }
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
            coin: selectedAccount.symbol,
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
        const output = formState.outputs[0];

        const network = getNetwork(selectedAccount.symbol);
        const amountInSubunits = unitsToSubunits({
            value: asAmountUnit(new BigNumber(output.amount)),
            decimals: token ? token.decimals : network.decimals,
        }).toString();

        let tokenData: string | undefined;
        if (token) {
            const calldataResult = Calldata.tron.trc20.transfer({
                to: output.address,
                amount: new BigNumber(amountInSubunits),
            });
            if (!calldataResult.data) {
                return rejectWithValue({
                    error: 'sign-transaction-failed',
                    message: 'Failed to build TRC-20 calldata.',
                });
            }
            tokenData = calldataResult.data.slice(2); // strip the "0x" prefix; firmware expects raw hex
        }

        const composed = await TrezorConnect.tronComposeTransaction({
            from: selectedAccount.descriptor,
            to: token ? token.contract : output.address,
            amount: amountInSubunits,
            blockHash,
            blockHeight,
            token: token
                ? {
                      contract: token.contract,
                      data: tokenData ?? '',
                      feeLimit: precomposedTransaction.fee
                          ? Number(precomposedTransaction.fee)
                          : undefined,
                  }
                : undefined,
        });

        if (!composed.success) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: composed.error.message,
            });
        }

        const { rawDataHex, ref_block_bytes, ref_block_hash, expiration, timestamp } =
            composed.payload;

        const ownerHex = tronUtils.tronAddressToHex(selectedAccount.descriptor);
        const contract = token
            ? [
                  {
                      type: 'TriggerSmartContract' as const,
                      parameter: {
                          value: {
                              owner_address: ownerHex,
                              contract_address: tronUtils.tronAddressToHex(token.contract),
                              data: tokenData!,
                          },
                      },
                  },
              ]
            : [
                  {
                      type: 'TransferContract' as const,
                      parameter: {
                          value: {
                              owner_address: ownerHex,
                              to_address: tronUtils.tronAddressToHex(output.address),
                              amount: amountInSubunits,
                          },
                      },
                  },
              ];

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
            // fee_limit is in SUN (not energy units); use the total estimated fee as the cap
            fee_limit:
                token && precomposedTransaction.fee
                    ? Number(precomposedTransaction.fee)
                    : undefined,
            contract,
        });

        if (!signed.success) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: signed.error.message,
            });
        }

        return { serializedTx: encodeBroadcastTransaction(rawDataHex, signed.payload.signature) };
    },
);
