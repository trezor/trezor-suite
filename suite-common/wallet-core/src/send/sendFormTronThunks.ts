import { Calldata } from '@suite-common/calldata';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type NetworkSymbol,
    getNetwork,
    getNetworkDisplaySymbol,
} from '@suite-common/wallet-config';
import {
    type Account,
    type ExternalOutput,
    type PrecomposedLevels,
    type PrecomposedTransaction,
} from '@suite-common/wallet-types';
import {
    TRON_BANDWIDTH_SUN_PRICE,
    asAmountSubunit,
    asAmountUnit,
    calculateMax,
    calculateTotal,
    getAccountIdentity,
    getExternalComposeOutput,
    subunitsToUnits,
    tronAddressToHex,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import { type BlockchainLinkResponse } from '@trezor/blockchain-link';
import TrezorConnect, { type TokenInfo } from '@trezor/connect';
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
    bytes: number,
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
        bytes,
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

const TRON_ACCOUNT_ACTIVATION_FEE_SUN = 1_000_000;

const calculateTrxTransfer = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: EstimateFeeLevel,
    isNewAccount: boolean,
    bytes: number,
): PrecomposedTransaction => {
    const baseFeeInSun = feeLevel.feePerTx || '0';
    const activationFeeInSun = isNewAccount ? TRON_ACCOUNT_ACTIVATION_FEE_SUN : 0;
    const totalFeeInSun = new BigNumber(baseFeeInSun).plus(activationFeeInSun).toString();
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
        fee: baseFeeInSun,
        accountActivationFee: isNewAccount ? String(TRON_ACCOUNT_ACTIVATION_FEE_SUN) : undefined,
        feePerByte: feeLevel.feePerUnit,
        bytes,
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

const isNewTronAccount = async (address: string, account: Account): Promise<boolean> => {
    if (!address) return false;
    const result = await TrezorConnect.getAccountInfo({
        coin: account.symbol,
        identity: getAccountIdentity(account),
        descriptor: address,
    });

    return result.success && (result.payload.empty ?? false);
};

const calculate = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: EstimateFeeLevel,
    networkSymbol: NetworkSymbol,
    bytes: number,
    token?: TokenInfo,
    isNewAccount?: boolean,
): PrecomposedTransaction =>
    token
        ? calculateTrc20Transfer(availableBalance, output, feeLevel, token, networkSymbol, bytes)
        : calculateTrxTransfer(availableBalance, output, feeLevel, isNewAccount ?? false, bytes);

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

        const ownerHex = tronUtils.tronAddressToHex(account.descriptor) ?? '';

        // Dummy block values — block fields are fixed-size in protobuf so bandwidth is identical
        // to what we'd get with real block data.
        const DUMMY_BLOCK_HASH = '0'.repeat(64);
        const DUMMY_BLOCK_HEIGHT = 0;

        const contract = tokenInfo
            ? {
                  type: 'TriggerSmartContract' as const,
                  parameter: {
                      value: {
                          owner_address: ownerHex,
                          contract_address: tronUtils.tronAddressToHex(tokenInfo.contract) ?? '',
                          data:
                              getTronEstimateFeeParams(
                                  to,
                                  amountForEstimation,
                                  tokenInfo,
                              ).data?.slice(2) ?? '',
                      },
                  },
              }
            : {
                  type: 'TransferContract' as const,
                  parameter: {
                      value: {
                          owner_address: ownerHex,
                          to_address: tronUtils.tronAddressToHex(to) ?? '',
                          amount: amountForEstimation,
                      },
                  },
              };

        const bandwidthEstimate = await TrezorConnect.tronComposeTransaction({
            contract,
            blockHash: DUMMY_BLOCK_HASH,
            blockHeight: DUMMY_BLOCK_HEIGHT,
        });

        if (!bandwidthEstimate.success) {
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: bandwidthEstimate.error.message,
            });
        }

        const bytes = bandwidthEstimate.payload.bandwidth;

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
            const availableBandwidth = Math.max(
                account.misc?.tronResources?.availableStakedBandwidth ?? 0,
                account.misc?.tronResources?.availableFreeBandwidth ?? 0,
            );
            const feeInSun = availableBandwidth < bytes ? bytes * TRON_BANDWIDTH_SUN_PRICE : 0;

            feeLevel = {
                feePerTx: String(feeInSun),
                feePerUnit: String(TRON_BANDWIDTH_SUN_PRICE),
            };
        }

        const isNewAccount =
            !tokenInfo && (await isNewTronAccount(formState.outputs[0].address, account));

        const tx = calculate(
            account.availableBalance,
            output,
            feeLevel,
            account.symbol,
            bytes,
            tokenInfo,
            isNewAccount,
        );

        if (tx.type !== 'error' && tx.max !== undefined) {
            tx.max = subunitsToUnits({
                value: asAmountSubunit(new BigNumber(tx.max)),
                decimals,
            }).toString();
        }

        if (tokenInfo && tx.type !== 'error') {
            tx.estimatedFeeLimit = tx.fee;
        }

        return { normal: tx };
    },
);

const getTrc20FeeLimitSun = (feeLimit: string, estimatedFee: string): number | undefined => {
    if (feeLimit !== '') return Number(feeLimit);
    if (estimatedFee !== '') return Number(estimatedFee);

    return undefined;
};

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

        const tokenFeeLimitSun = token
            ? getTrc20FeeLimitSun(formState.feeLimit, precomposedTransaction.fee)
            : undefined;

        const ownerHex = tronAddressToHex(selectedAccount.descriptor);
        const recipientHex = token
            ? tronAddressToHex(token.contract)
            : tronAddressToHex(output.address);

        if (!ownerHex || !recipientHex) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Invalid address checksum.',
            });
        }

        const contract = token
            ? {
                  type: 'TriggerSmartContract' as const,
                  parameter: {
                      value: {
                          owner_address: ownerHex,
                          contract_address: recipientHex,
                          data: tokenData!,
                      },
                  },
              }
            : {
                  type: 'TransferContract' as const,
                  parameter: {
                      value: {
                          owner_address: ownerHex,
                          to_address: recipientHex,
                          amount: amountInSubunits,
                      },
                  },
              };

        const composed = await TrezorConnect.tronComposeTransaction({
            contract,
            blockHash,
            blockHeight,
            fee_limit: tokenFeeLimitSun,
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
            fee_limit: tokenFeeLimitSun,
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
