import BigNumber from 'bignumber.js';
import { FieldError, UseFormMethods } from 'react-hook-form';
import { EthereumTransaction, TokenInfo, ComposeOutput, TxOutputType } from 'trezor-connect';
import Common from 'ethereumjs-common';
import { Transaction, TxData } from 'ethereumjs-tx';
import { fromWei, padLeft, toHex, toWei } from 'web3-utils';

import { DEFAULT_PAYMENT, DEFAULT_VALUES, ERC20_TRANSFER } from '@wallet-constants/sendForm';
import { amountToSatoshi, networkAmountToSatoshi } from '@wallet-utils/accountUtils';
import { isEnabled as isFeatureEnabled } from '@suite-utils/features';

import type { Network, Account, CoinFiatRates, RbfTransactionParams } from '@wallet-types';
import type {
    FormState,
    FeeInfo,
    EthTransactionData,
    ExternalOutput,
    Output,
    UseSendFormState,
} from '@wallet-types/sendForm';

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

const padLeftEven = (hex: string): string => (hex.length % 2 !== 0 ? `0${hex}` : hex);

export const sanitizeHex = ($hex: string): string => {
    const hex = $hex.toLowerCase().substring(0, 2) === '0x' ? $hex.substring(2) : $hex;
    if (hex === '') return '';
    return `0x${padLeftEven(hex)}`;
};

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

// TrezorConnect.blockchainEstimateFee for ethereum
// NOTE:
// - amount cannot be "0" (send max calculation), use at least 1 unit.
export const getEthereumEstimateFeeParams = (
    to: string,
    token?: TokenInfo,
    amount?: string,
    data?: string,
) => {
    if (token) {
        return {
            to: token.address,
            value: '0x0',
            data: getSerializedErc20Transfer(token, to, amount || token.balance!), // if amount is not set (set-max case) use whole token balance
        };
    }
    return {
        to,
        value: amount ? getSerializedAmount(amount) : toHex('1'), // if amount is not set (set-max case) use at least 1 wei
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
        result.to = txInfo.token.address;
        // replace tx value
        result.value = '0x00';
    }

    return result;
};

export const serializeEthereumTx = (tx: TxData & EthereumTransaction) => {
    // ethereumjs-tx doesn't support ETC (chain 61) by default
    // and it needs to be declared as custom chain
    // see: https://github.com/ethereumjs/ethereumjs-tx/blob/master/examples/custom-chain-tx.ts
    const options =
        tx.chainId === 61
            ? {
                  common: Common.forCustomChain(
                      'mainnet',
                      {
                          name: 'ethereum-classic',
                          networkId: 1,
                          chainId: 61,
                      },
                      'petersburg',
                  ),
              }
            : {
                  chain: tx.chainId,
              };

    const ethTx = new Transaction(tx, options);
    return `0x${ethTx.serialize().toString('hex')}`;
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

export const getInputState = (error?: FieldError, value?: string) => {
    if (error) {
        return 'error';
    }

    if (value && value.length > 0 && !error) {
        return 'success';
    }
};

export const getFiatRate = (fiatRates: CoinFiatRates | undefined, currency: string) => {
    if (!fiatRates || !fiatRates.current || !fiatRates.current.rates) return;
    return fiatRates.current.rates[currency];
};

export const getFeeUnits = (networkType: Network['networkType']) => {
    if (networkType === 'ethereum') return 'GWEI';
    if (networkType === 'ripple') return 'Drops';
    return 'sat/B';
};

// Find all errors with type='compose' in FormState errors
export const findComposeErrors = (errors: UseFormMethods['errors'], prefix?: string) => {
    const composeErrors: string[] = [];
    if (!errors || typeof errors !== 'object') return composeErrors;
    Object.keys(errors).forEach(key => {
        const val = errors[key];
        if (val) {
            if (Array.isArray(val)) {
                // outputs
                val.forEach((output, index) =>
                    composeErrors.push(...findComposeErrors(output, `outputs[${index}]`)),
                );
            } else if (
                typeof val === 'object' &&
                Object.prototype.hasOwnProperty.call(val, 'type') &&
                val.type === 'compose'
            ) {
                // regular top level field
                composeErrors.push(prefix ? `${prefix}.${key}` : key);
            }
        }
    });
    return composeErrors;
};

export const findToken = (tokens: Account['tokens'], address?: string | null) => {
    if (!address || !tokens) return;
    return tokens.find(t => t.address === address);
};

// BTC composeTransaction
// returns ComposeOutput[]
export const getBitcoinComposeOutputs = (values: Partial<FormState>, symbol: Account['symbol']) => {
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
            const amount = networkAmountToSatoshi(output.amount, symbol);
            if (address) {
                result.push({
                    type: 'external',
                    address,
                    amount,
                });
            } else {
                result.push({
                    type: 'noaddress',
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
        const finalOutput = result.find(o => o.type === 'send-max' || o.type === 'external');
        if (finalOutput) {
            // replace to noaddress
            finalOutput.type = finalOutput.type === 'external' ? 'noaddress' : 'send-max-noaddress';
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
            type: 'external',
            address,
            amount: amountInSatoshi,
        };
    } else {
        output = {
            type: 'noaddress',
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
    outputs: TxOutputType[],
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
        isFeatureEnabled('RBF') && network.features?.includes('rbf')
            ? ['bitcoinRBF', 'broadcast']
            : ['broadcast'],
    outputs: [{ ...DEFAULT_PAYMENT, currency }],
});
