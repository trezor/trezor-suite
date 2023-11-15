import {
    FieldError,
    FieldErrors,
    FieldErrorsImpl,
    FieldPath,
    FieldValues,
    Merge,
} from 'react-hook-form';

import BigNumber from 'bignumber.js';
import { fromWei, padLeft, toHex, toWei } from 'web3-utils';

import { fiatCurrencies } from '@suite-common/suite-config';
import { isFeatureFlagEnabled } from '@suite-common/suite-utils';
import { Network, NetworkType } from '@suite-common/wallet-config';
import { EthereumTransaction, TokenInfo, ComposeOutput, PROTO } from '@trezor/connect';
import {
    COMPOSE_ERROR_TYPES,
    DEFAULT_PAYMENT,
    DEFAULT_VALUES,
    ERC20_TRANSFER,
} from '@suite-common/wallet-constants';
import type {
    FormState,
    FeeInfo,
    EthTransactionData,
    ExternalOutput,
    Output,
    UseSendFormState,
    RbfTransactionParams,
    CoinFiatRates,
    Account,
    CurrencyOption,
    ExcludedUtxos,
} from '@suite-common/wallet-types';

import { amountToSatoshi, getUtxoOutpoint, networkAmountToSatoshi } from './accountUtils';
import { sanitizeHex } from './ethUtils';

export const calculateTotal = (amount: string, fee: string): string => {
    try {
        const total = new BigNumber(amount).plus(fee);
        if (total.isNaN()) {
            console.error('calculateTotal: Amount is not a number', amount, fee);
            return '0';
        }
        return total.toString();
    } catch (error) {
        console.error('calculateTotal: error', error);
        return '0';
    }
};

export const calculateMax = (availableBalance: string, fee: string): string => {
    try {
        const max = new BigNumber(availableBalance).minus(fee);
        if (max.isNaN()) {
            console.error('calculateMax: Amount is not a number', availableBalance, fee);
            return '0';
        }
        if (max.isLessThan(0)) return '0';
        return max.toFixed();
    } catch (error) {
        console.error('calculateMax: error', error);
        return '0';
    }
};

// ETH SPECIFIC

/*
    Calculate fee from gas price and gas limit
 */
export const calculateEthFee = (gasPrice?: string, gasLimit?: string): string => {
    if (!gasPrice || !gasLimit) {
        return '0';
    }
    try {
        const result = new BigNumber(gasPrice).times(gasLimit);
        if (result.isNaN()) throw new Error('NaN');
        return result.toFixed();
    } catch (error) {
        return '0';
    }
};

const getSerializedAmount = (amount?: string) => (amount ? toHex(toWei(amount, 'ether')) : '0x00');

const getSerializedErc20Transfer = (token: TokenInfo, to: string, amount: string) => {
    // 32 bytes address parameter, remove '0x' prefix
    const erc20recipient = padLeft(to, 64).substring(2);
    // convert amount to satoshi
    const tokenAmount = amountToSatoshi(amount, token.decimals);
    // 32 bytes amount paramter, remove '0x' prefix
    const erc20amount = padLeft(toHex(tokenAmount), 64).substring(2);
    // join data
    return `0x${ERC20_TRANSFER}${erc20recipient}${erc20amount}`;
};

// TrezorConnect.blockchainEstimateFee for ETH
export const getEthereumEstimateFeeParams = (
    to: string,
    amount: string,
    token?: TokenInfo,
    data?: string,
) => {
    if (token) {
        return {
            to: token.contract,
            value: '0x0',
            data: getSerializedErc20Transfer(token, to, amount),
        };
    }

    return {
        to,
        value: getSerializedAmount(amount),
        data: data || '',
    };
};

export const prepareEthereumTransaction = (txInfo: EthTransactionData) => {
    const result: EthereumTransaction = {
        to: txInfo.to,
        value: getSerializedAmount(txInfo.amount),
        chainId: txInfo.chainId,
        nonce: toHex(txInfo.nonce),
        gasLimit: toHex(txInfo.gasLimit),
        gasPrice: toHex(toWei(txInfo.gasPrice, 'gwei')),
    };

    if (!txInfo.token && txInfo.data) {
        result.data = sanitizeHex(txInfo.data);
    }

    // Build erc20 'transfer' method
    if (txInfo.token) {
        // join data
        result.data = getSerializedErc20Transfer(txInfo.token, txInfo.to, txInfo.amount);
        // replace tx recipient to smart contract address
        result.to = txInfo.token.contract;
        // replace tx value
        result.value = '0x00';
    }

    return result;
};

export const getFeeLevels = (networkType: Network['networkType'], feeInfo: FeeInfo) => {
    const levels = feeInfo.levels.concat({
        label: 'custom',
        feePerUnit: '0',
        blocks: -1,
    });

    if (networkType === 'ethereum') {
        // convert wei to gwei and floor value to avoid decimals
        return levels.map(level => {
            const gwei = new BigNumber(fromWei(level.feePerUnit, 'gwei'));
            // blockbook/geth may return 0 in feePerUnit. if this happens set at least minFee
            const feePerUnit =
                level.label !== 'custom' && gwei.lt(feeInfo.minFee)
                    ? feeInfo.minFee.toString()
                    : gwei.integerValue(BigNumber.ROUND_FLOOR).toString();
            return {
                ...level,
                feePerUnit,
                feeLimit: level.feeLimit,
            };
        });
    }

    return levels;
};

export const getInputState = (
    error?: FieldError | Merge<FieldError, FieldErrorsImpl<FieldValues>>,
    value?: string,
) => {
    if (error) {
        return 'error';
    }

    if (value && value.length > 0 && !error) {
        return 'success';
    }
};

export const isLowAnonymityWarning = (error?: Merge<FieldError, FieldErrorsImpl<Output>>) =>
    error?.amount?.type === COMPOSE_ERROR_TYPES.ANONYMITY;

export const getFiatRate = (fiatRates: CoinFiatRates | undefined, currency: string) => {
    if (!fiatRates || !fiatRates.current || !fiatRates.current.rates) return;
    return fiatRates.current.rates[currency];
};

export const getFeeUnits = (networkType: NetworkType) => {
    if (networkType === 'ethereum') return 'GWEI';
    if (networkType === 'ripple') return 'Drops';
    if (networkType === 'cardano') return 'Lovelaces/B';
    return 'sat/B';
};

// Find all validation errors set while composing a transaction
export const findComposeErrors = <T extends FieldValues>(
    errors: FieldErrors<T>,
    prefix?: string,
) => {
    const composeErrors: FieldPath<T>[] = [];
    if (!errors || typeof errors !== 'object') return composeErrors;
    Object.keys(errors).forEach(key => {
        const val = errors[key];
        if (val) {
            if (Array.isArray(val)) {
                // outputs
                val.forEach((output: FieldErrors<Output>, index) =>
                    composeErrors.push(
                        ...(findComposeErrors(output, `outputs.${index}`) as FieldPath<T>[]),
                    ),
                );
            } else if (
                typeof val === 'object' &&
                Object.prototype.hasOwnProperty.call(val, 'type') &&
                Object.values(COMPOSE_ERROR_TYPES).includes(val.type as string)
            ) {
                // regular top level field
                composeErrors.push((prefix ? `${prefix}.${key}` : key) as FieldPath<T>);
            }
        }
    });
    return composeErrors;
};

export const findToken = (tokens: Account['tokens'], address?: string | null) => {
    if (!address || !tokens) return;
    return tokens.find(t => t.contract === address);
};

// BTC composeTransaction
// returns ComposeOutput[]
export const getBitcoinComposeOutputs = (
    values: Partial<FormState>,
    symbol: Account['symbol'],
    isSatoshis?: boolean,
) => {
    const result: ComposeOutput[] = [];
    if (!values || !Array.isArray(values.outputs)) return result;

    const { setMaxOutputId } = values;

    values.outputs.forEach((output, index) => {
        if (!output || typeof output !== 'object') return; // skip invalid object

        if (output.type === 'opreturn' && output.dataHex) {
            result.push({
                type: 'opreturn',
                dataHex: output.dataHex,
            });
        }

        const { address } = output;
        const isMaxActive = setMaxOutputId === index;
        if (isMaxActive) {
            if (address) {
                result.push({
                    type: 'send-max',
                    address,
                });
            } else {
                result.push({ type: 'send-max-noaddress' });
            }
        } else if (output.amount) {
            const amount = isSatoshis
                ? output.amount
                : networkAmountToSatoshi(output.amount, symbol);

            if (address) {
                result.push({
                    type: 'payment',
                    address,
                    amount,
                });
            } else {
                result.push({
                    type: 'payment-noaddress',
                    amount,
                });
            }
        }
    });

    // corner case for multiple outputs
    // one Output is valid and "final" but other has only address
    // to prevent composing "final" transaction switch it to not-final (noaddress)
    const hasIncompleteOutput = values.outputs.find(
        (o, i) => setMaxOutputId !== i && o && o.address && !o.amount,
    );
    if (hasIncompleteOutput) {
        const finalOutput = result.find(o => o.type === 'send-max' || o.type === 'payment');
        if (finalOutput) {
            // replace to *-noaddress
            finalOutput.type =
                finalOutput.type === 'payment' ? 'payment-noaddress' : 'send-max-noaddress';
        }
    }

    return result;
};

// ETH/XRP composeTransaction, only one Output is used
// returns { output, tokenInfo, decimals }
export const getExternalComposeOutput = (
    values: Partial<FormState>,
    account: Account,
    network: Network,
) => {
    if (!values || !Array.isArray(values.outputs) || !values.outputs[0]) return;
    const out = values.outputs[0];
    if (!out || typeof out !== 'object') return;
    const { address, amount, token } = out;

    const isMaxActive = typeof values.setMaxOutputId === 'number';
    if (!isMaxActive && !amount) return; // incomplete Output

    const tokenInfo = findToken(account.tokens, token);
    const decimals = tokenInfo ? tokenInfo.decimals : network.decimals;
    const amountInSatoshi = amountToSatoshi(amount, decimals);

    let output: ExternalOutput;
    if (isMaxActive) {
        if (address) {
            output = {
                type: 'send-max',
                address,
            };
        } else {
            output = {
                type: 'send-max-noaddress',
            };
        }
    } else if (address) {
        output = {
            type: 'payment',
            address,
            amount: amountInSatoshi,
        };
    } else {
        output = {
            type: 'payment-noaddress',
            amount: amountInSatoshi,
        };
    }

    return {
        output,
        tokenInfo,
        decimals,
    };
};

export const restoreOrigOutputsOrder = (
    outputs: PROTO.TxOutputType[],
    origOutputs: RbfTransactionParams['outputs'],
    origTxid: string,
) => {
    const usedIndex: number[] = []; // collect used indexes to avoid duplicates
    return outputs
        .map(output => {
            const index = origOutputs.findIndex((prevOutput, i) => {
                if (usedIndex.includes(i)) return false;
                if (prevOutput.type === 'opreturn' && output.script_type === 'PAYTOOPRETURN')
                    return true;
                if (prevOutput.type === 'change' && output.address_n) return true;
                if (prevOutput.type === 'payment' && output.address === prevOutput.address)
                    return true;
                return false;
            });
            if (index >= 0) {
                usedIndex.push(index);
                return { ...output, orig_index: index, orig_hash: origTxid };
            }
            return output;
        })
        .sort((a, b) => {
            if (typeof a.orig_index === 'undefined' && typeof b.orig_index === 'undefined')
                return 0;
            if (typeof b.orig_index === 'undefined') return -1;
            if (typeof a.orig_index === 'undefined') return 1;
            return a.orig_index - b.orig_index;
        });
};

export const getDefaultValues = (
    currency: Output['currency'],
    network: UseSendFormState['network'],
): FormState => ({
    ...DEFAULT_VALUES,
    options:
        isFeatureFlagEnabled('RBF') && network.features?.includes('rbf')
            ? ['bitcoinRBF', 'broadcast']
            : ['broadcast'],
    outputs: [{ ...DEFAULT_PAYMENT, currency }],
    selectedUtxos: [],
});

export const buildCurrencyOptions = (selected: CurrencyOption) => {
    const result: CurrencyOption[] = [];

    Object.keys(fiatCurrencies).forEach(currency => {
        if (selected.value === currency) {
            return;
        }

        result.push({ value: currency, label: currency.toUpperCase() });
    });

    return result;
};

export interface GetExcludedUtxosProps {
    utxos?: Account['utxo'];
    anonymitySet?: NonNullable<Account['addresses']>['anonymitySet'];
    dustLimit?: number;
    targetAnonymity?: number;
}

export const getExcludedUtxos = ({
    utxos,
    anonymitySet,
    dustLimit,
    targetAnonymity,
}: GetExcludedUtxosProps) => {
    // exclude utxos from default composeTransaction process (see sendFormBitcoinActions)
    // utxos are stored as dictionary where:
    // `key` is an outpoint (string combination of utxo.txid + utxo.vout)
    // `value` is the reason
    // utxos might be spent using CoinControl feature
    const excludedUtxos: ExcludedUtxos = {};
    utxos?.forEach(utxo => {
        const outpoint = getUtxoOutpoint(utxo);
        const anonymity = (anonymitySet && anonymitySet[utxo.address]) || 1;
        if (new BigNumber(utxo.amount).lt(Number(dustLimit))) {
            // is lower than dust limit
            excludedUtxos[outpoint] = 'dust';
        } else if (anonymity < (targetAnonymity || 1)) {
            // didn't reach desired anonymity (coinjoin account)
            excludedUtxos[outpoint] = 'low-anonymity';
        }
    });
    return excludedUtxos;
};
