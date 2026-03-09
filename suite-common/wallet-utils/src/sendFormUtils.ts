import {
    FieldError,
    FieldErrors,
    FieldErrorsImpl,
    FieldPath,
    FieldValues,
    Merge,
} from 'react-hook-form';

import { fromWei, numberToHex, padLeft, toWei } from 'web3-utils';

import { Network, NetworkSymbol, NetworkType, getNetwork } from '@suite-common/wallet-config';
import {
    COMPOSE_ERROR_TYPES,
    DEFAULT_PAYMENT,
    DEFAULT_VALUES,
    ERC20_TRANSFER,
} from '@suite-common/wallet-constants';
import type {
    Account,
    AccountKey,
    BaseCurrencyOption,
    EthTransactionData,
    ExternalOutput,
    FeeInfo,
    FormState,
    FormStateTrading,
    FormStateTradingExchange,
    GeneralPrecomposedTransactionFinal,
    Output,
    RbfTransactionParams,
    SendFormDraftKey,
    TokenAddress,
} from '@suite-common/wallet-types';
import { BaseCurrencyCode, baseCurrencies } from '@trezor/blockchain-link-types';
import {
    ComposeOutput,
    EthereumTransaction,
    EthereumTransactionEIP1559,
    FeeLevel,
    PROTO,
    TokenInfo,
} from '@trezor/connect';
import { BigNumber, typedObjectKeys } from '@trezor/utils';

import {
    convertAmountUnitsToSubunits,
    formatNetworkAmount,
    networkAmountToSmallestUnit,
} from './amountUtils';
import { isBaseCurrencyWithSats } from './baseCurrency';
import {
    getEvmTransactionTextSignature,
    isEip1559,
    isEvmApprovalTxByTextSignature,
    sanitizeHex,
} from './ethUtils';

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

// EVM SPECIFIC

/**
 * Calculate the EVM fee from gas price / max fee and gas limit.
 * @param {string} [gasPriceInWei] - The gas price in wei.
 * @param {string} [gasLimit] - The gas limit.
 * @returns {string} The calculated fee in wei, or '0' if inputs are invalid.
 */
export const calculateTotalGasCost = (gasPriceInWei?: string, gasLimit?: string): string => {
    if (!gasPriceInWei || !gasLimit) {
        return '0';
    }

    const gasPriceBN = new BigNumber(gasPriceInWei);
    const gasLimitBN = new BigNumber(gasLimit);

    if (gasPriceBN.isNaN() || gasLimitBN.isNaN()) {
        return '0';
    }

    const fee = gasPriceBN.times(gasLimitBN);

    if (fee.isNaN()) {
        return '0';
    }

    return fee.toFixed();
};

const getSerializedAmount = (amount?: string) =>
    amount ? numberToHex(toWei(amount, 'ether')) : '0x00';

const getSerializedErc20Transfer = (token: TokenInfo, to: string, amount: string) => {
    // 32 bytes address parameter, remove '0x' prefix
    const erc20recipient = padLeft(to, 64).substring(2);
    // convert amount to satoshi
    const tokenAmount = convertAmountUnitsToSubunits(amount, token.decimals);
    // 32 bytes amount paramter, remove '0x' prefix
    const erc20amount = padLeft(numberToHex(tokenAmount), 64).substring(2);

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
        // use the data if provided
        if (data) {
            return {
                to,
                value: '0x0',
                data,
            };
        }

        // otherwise compose basic ERC-20 token transfer data
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

export const prepareEthereumTransaction = (
    txInfo: EthTransactionData,
): EthereumTransaction | EthereumTransactionEIP1559 => {
    let result: EthereumTransaction | EthereumTransactionEIP1559;

    const commonTxData = {
        to: txInfo.to,
        value: getSerializedAmount(txInfo.amount),
        chainId: txInfo.chainId,
        nonce: numberToHex(txInfo.nonce),
        gasLimit: numberToHex(txInfo.gasLimit),
        payment_req: txInfo.payment_req,
    };

    if (txInfo.maxFeePerGas) {
        result = {
            ...commonTxData,
            gasPrice: undefined,
            maxFeePerGas: numberToHex(toWei(txInfo.maxFeePerGas, 'gwei')),
            maxPriorityFeePerGas: numberToHex(toWei(txInfo.maxPriorityFeePerGas || '0', 'gwei')),
        } as EthereumTransactionEIP1559;
    } else if (txInfo.gasPrice) {
        result = {
            ...commonTxData,
            gasPrice: numberToHex(toWei(txInfo.gasPrice, 'gwei')),
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
        } as EthereumTransaction;
    } else {
        throw new Error('No gas price or maxFeePerGas and maxPriorityFeePerGas provided');
    }

    if (!txInfo.token && txInfo.data) {
        result.data = sanitizeHex(txInfo.data);
    }

    // Build erc20 'transfer' method or use provided data in case of approve/revoke transaction
    if (txInfo.token) {
        // join data
        const evmTxTextSignature = getEvmTransactionTextSignature(txInfo.data);

        result.data = isEvmApprovalTxByTextSignature(evmTxTextSignature)
            ? txInfo.data
            : getSerializedErc20Transfer(txInfo.token, txInfo.to, txInfo.amount);

        // replace tx recipient to smart contract address
        result.to = txInfo.token.contract;
        // replace tx value
        result.value = '0x00';
    }

    return result;
};

type GetConvertedOrDefaultFeeLevelsProps = {
    feeInfo?: FeeInfo;
    networkType: NetworkType;
};

const getConvertedOrDefaultFeeLevels = ({
    feeInfo,
    networkType,
}: GetConvertedOrDefaultFeeLevelsProps) => {
    if (!feeInfo) return [];

    const levels = feeInfo.levels.concat({
        label: 'custom',
        feePerUnit: '0',
        blocks: -1,
    });

    if (networkType === 'ethereum') {
        return levels.map(level => {
            const { feePerUnit, maxFeePerGas, maxPriorityFeePerGas, baseFeePerGas } = level;

            const feePerUnitInGwei = fromWei(feePerUnit, 'gwei');
            const maxFeePerGasInGwei = maxFeePerGas ? fromWei(maxFeePerGas, 'gwei') : undefined;
            const maxPriorityFeePerGasInGwei = maxPriorityFeePerGas
                ? fromWei(maxPriorityFeePerGas, 'gwei')
                : undefined;
            const baseFeePerGasInGwei = baseFeePerGas ? fromWei(baseFeePerGas, 'gwei') : undefined;

            return {
                ...level,
                feePerUnit: feePerUnitInGwei,
                maxFeePerGas: maxFeePerGasInGwei,
                maxPriorityFeePerGas: maxPriorityFeePerGasInGwei,
                baseFeePerGas: baseFeePerGasInGwei,
            };
        });
    }

    return levels;
};

export const getConvertedOrDefaultFeeInfo = ({
    networkType,
    feeInfo,
}: GetConvertedOrDefaultFeeLevelsProps): FeeInfo => ({
    levels: getConvertedOrDefaultFeeLevels({ networkType, feeInfo }),
    blockHeight: feeInfo?.blockHeight ?? 0,
    blockTime: feeInfo?.blockTime ?? 0,
    minFee: feeInfo?.minFee ?? 0,
    maxFee: feeInfo?.maxFee ?? 0,
    minPriorityFee: feeInfo?.minPriorityFee ?? 0,
    dustLimit: feeInfo?.dustLimit ?? 0,
    feeLimit: feeInfo?.feeLimit ?? 0,
});

export const isLowAnonymityWarning = (error?: Merge<FieldError, FieldErrorsImpl<Output>>) =>
    error?.amount?.type === COMPOSE_ERROR_TYPES.ANONYMITY;

export const getFee = (networkType: NetworkType, tx: GeneralPrecomposedTransactionFinal) => {
    if (networkType === 'solana') {
        return tx.fee;
    }

    if (networkType === 'ethereum' && isEip1559(tx)) {
        return tx.maxFeePerGas;
    }

    return tx.feePerByte;
};

export const getLowestFeeFromLevels = (levels: FeeLevel[]): BigNumber =>
    BigNumber.minimum(
        ...levels
            .filter(({ label }) => label !== 'custom')
            .map(({ feePerUnit }) => BigNumber(feePerUnit)),
    );

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

    return tokens.find(t => t.contract.toLowerCase() === address.toLowerCase());
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
                : networkAmountToSmallestUnit(output.amount, symbol);

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

export const getApprovalComposeOutput = (
    contract: string | undefined,
    account: Account,
    network: Network,
): { output: ExternalOutput; tokenInfo: TokenInfo | undefined; decimals: number } | undefined => {
    if (!contract) {
        return undefined;
    }

    const tokenInfo = findToken(account.tokens, contract);
    const decimals = tokenInfo ? tokenInfo.decimals : network.decimals;

    return {
        output: {
            address: contract,
            amount: '0',
            type: 'payment',
        },
        tokenInfo,
        decimals,
    };
};

// ETH/XRP composeTransaction, only one Output is used
// returns { output, tokenInfo, decimals }
export const getExternalComposeOutput = (
    values: Partial<FormState>,
    account: Account,
    network: Network,
    formattedFallbackAmount?: string, // for cases when value is zero but amount is available in eth data
) => {
    if (!values || !Array.isArray(values.outputs) || !values.outputs[0]) return;
    const out = values.outputs[0];
    if (!out || typeof out !== 'object') return;
    const { address, amount, token } = out;

    const isMaxActive = typeof values.setMaxOutputId === 'number';
    if (!isMaxActive && !amount) return; // incomplete Output

    const tokenInfo = findToken(account.tokens, token);
    const decimals = tokenInfo ? tokenInfo.decimals : network.decimals;
    const formattedAmount = convertAmountUnitsToSubunits(amount, decimals);

    let output: ExternalOutput;
    if (isMaxActive) {
        if (address) {
            output = {
                type: 'send-max',
                address,
                amount: formattedAmount,
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
            amount: formattedFallbackAmount || formattedAmount,
        };
    } else {
        output = {
            type: 'payment-noaddress',
            amount: formattedAmount,
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

export const getDefaultValues = (currency: Output['currency']): FormState => ({
    ...DEFAULT_VALUES,
    options: ['broadcast', 'destinationTag'],
    outputs: [{ ...DEFAULT_PAYMENT, currency }],
    selectedUtxos: [],
});

type BuildCurrencyOptionParams = {
    currency: BaseCurrencyCode | '';
    areSatsDisplayed: boolean;
};

export const buildCurrencyShortOption = ({
    currency,
    areSatsDisplayed,
}: BuildCurrencyOptionParams): BaseCurrencyOption => {
    if (currency === '') return { value: '', label: '' };

    return {
        value: currency,
        label:
            isBaseCurrencyWithSats(currency) && areSatsDisplayed ? 'sat' : currency.toUpperCase(),
    };
};

export const buildCurrencyLongOption = ({
    currency,
    areSatsDisplayed,
}: BuildCurrencyOptionParams): BaseCurrencyOption => {
    const shortOption = buildCurrencyShortOption({ currency, areSatsDisplayed });

    if (currency === '') return shortOption;
    else {
        return {
            value: shortOption.value,
            label:
                shortOption.label +
                ' · ' +
                (isBaseCurrencyWithSats(currency) && areSatsDisplayed
                    ? 'Satoshis'
                    : baseCurrencies[currency].label),
        };
    }
};

type BuildCurrencyOptionsParams = {
    selected: BaseCurrencyOption;
    areSatsDisplayed: boolean;
};

export const buildCurrencyOptions = ({
    selected,
    areSatsDisplayed,
}: BuildCurrencyOptionsParams): BaseCurrencyOption[] => {
    const result: BaseCurrencyOption[] = [];

    typedObjectKeys(baseCurrencies).forEach(currency => {
        if (selected.value === currency) {
            return;
        }

        result.push(buildCurrencyLongOption({ currency, areSatsDisplayed }));
    });

    return result;
};

export const getSendFormDraftKey = (
    accountKey: AccountKey,
    tokenAddress?: TokenAddress,
): SendFormDraftKey =>
    tokenAddress ? (`${accountKey}-${tokenAddress}` as SendFormDraftKey) : accountKey;

type AmountValidationResult =
    | { type: 'ok' }
    | { type: 'not_enough' }
    | { type: 'reserve'; reserve: string };

interface GetAmountValidationResultParams {
    amount: string | undefined;
    contractAddress?: string | null;
    account: Account;
    areSatsUsed?: boolean;
}

export const getAmountValidationResult = ({
    amount,
    contractAddress,
    account,
    areSatsUsed,
}: GetAmountValidationResultParams): AmountValidationResult => {
    const token = findToken(account.tokens, contractAddress);
    let formattedAvailableBalance: string;

    if (token) {
        formattedAvailableBalance = token.balance || '0';
    } else {
        formattedAvailableBalance = areSatsUsed
            ? account.availableBalance
            : formatNetworkAmount(account.availableBalance, account.symbol);
    }

    const amountBig = new BigNumber(amount ?? '0');

    if (amountBig.gt(formattedAvailableBalance)) {
        const reserve =
            !token && (account.networkType === 'ripple' || account.networkType === 'stellar')
                ? formatNetworkAmount(account.misc.reserve, account.symbol)
                : undefined;

        if (reserve && amountBig.lt(formatNetworkAmount(account.balance, account.symbol))) {
            return { type: 'reserve', reserve };
        }

        return { type: 'not_enough' };
    }

    return { type: 'ok' };
};

export const isAmountTooHigh = (params: GetAmountValidationResultParams): boolean =>
    getAmountValidationResult(params).type !== 'ok';

export const getMevProtectedTxData = (
    symbol: NetworkSymbol,
    hex: string,
    isMevProtectionEnabled: boolean,
) => {
    if (!isMevProtectionEnabled) return { hex, disableAlternativeRPC: true };
    const isMevSupported = getNetwork(symbol).features.includes('mev-protection');
    if (!isMevSupported) return hex;

    return hex;
};

export const isExchangeTradingForm = (
    form: FormStateTrading | undefined,
): form is FormStateTradingExchange => form?.activeSection === 'exchange';

interface GetNetworkReserveProps {
    symbol: NetworkSymbol;
    contractAddress: string | undefined | null;
    isEnabled?: boolean;
}

/**
 * Reserve defined in networksConfig.ts applies to the native token only
 */
export const getNetworkReserve = ({
    symbol,
    contractAddress,
    isEnabled,
}: GetNetworkReserveProps) => {
    if (
        (!!contractAddress && contractAddress !== '0x0000000000000000000000000000000000000000') ||
        !isEnabled
    )
        return undefined;
    const network = getNetwork(symbol);

    return network.nativeTokenReserve;
};

interface GetCryptoAmountWithReserveProps {
    symbol: NetworkSymbol;
    contractAddress?: string | null;
    balance: string;
    amount: string;
    fee?: string;
    isNetworkReserveEnabled?: boolean;
}

export const getCryptoAmountWithReserve = ({
    symbol,
    contractAddress,
    balance,
    amount,
    fee = '0',
    isNetworkReserveEnabled,
}: GetCryptoAmountWithReserveProps) => {
    const networkReserve = getNetworkReserve({
        symbol,
        contractAddress,
        isEnabled: isNetworkReserveEnabled,
    });
    if (!networkReserve) return amount;

    const accountBalance = new BigNumber(balance);
    const reservePlusFee = new BigNumber(networkReserve).plus(fee);

    if (accountBalance.minus(amount).gt(reservePlusFee)) {
        return amount;
    }

    const maxAmount = accountBalance.minus(reservePlusFee);

    return maxAmount.lt(0) ? '0' : maxAmount.toString();
};

interface GetCryptoMaxAmountWithReserveProps {
    symbol: NetworkSymbol;
    contractAddress?: string | null;
    balance: string;
    amount: string;
    fee?: string;
    isNetworkReserveEnabled?: boolean;
}

export const getCryptoMaxAmountWithReserve = ({
    symbol,
    contractAddress,
    balance,
    amount,
    fee = '0',
    isNetworkReserveEnabled,
}: GetCryptoMaxAmountWithReserveProps) => {
    const networkReserve = getNetworkReserve({
        symbol,
        contractAddress,
        isEnabled: isNetworkReserveEnabled,
    });
    if (!networkReserve) return amount;

    const accountBalance = new BigNumber(balance);
    const reservePlusFee = new BigNumber(networkReserve).plus(fee);

    if (new BigNumber(amount).plus(reservePlusFee).gt(accountBalance)) {
        const maxAmount = accountBalance.minus(reservePlusFee);

        return maxAmount.lt(0) ? '0' : maxAmount.toFixed();
    }

    return amount;
};

interface IsAmountWithinNetworkReserveProps {
    reserve?: string;
    balance?: string;
    fee?: string;
    amount: string;
}

/**
 * Returns true if the amount does not violate the network reserve constraint,
 * i.e. balance - amount - fee >= reserve.
 */
export const isAmountWithinNetworkReserve = ({
    reserve,
    balance,
    fee = '0',
    amount,
}: IsAmountWithinNetworkReserveProps): boolean => {
    if (!reserve || !balance || !amount) return true;

    const sendAmount = new BigNumber(amount);
    const accountBalance = new BigNumber(balance);

    return sendAmount.lte(accountBalance.minus(reserve).minus(fee));
};
