import {
    type FieldError,
    type FieldErrors,
    type FieldErrorsImpl,
    type FieldPath,
    type FieldValues,
    type Merge,
} from 'react-hook-form';

import { type NetworkSymbol, type NetworkType, getNetwork } from '@suite-common/wallet-config';
import {
    COMPOSE_ERROR_TYPES,
    DEFAULT_PAYMENT,
    DEFAULT_VALUES,
    ETH_ESTIMATED_GAS_LIMIT_MULTIPLIER,
} from '@suite-common/wallet-constants';
import type {
    Account,
    AccountKey,
    BaseCurrencyOption,
    FeeInfo,
    FormState,
    FormStateTrading,
    FormStateTradingExchange,
    FormStateTradingSell,
    GeneralPrecomposedTransactionFinal,
    Output,
    RbfTransactionParams,
    SendFormDraftKey,
    TokenAddress,
} from '@suite-common/wallet-types';
import {
    type BaseCurrencyCode,
    baseCurrencies,
    isBaseCurrencyCode,
} from '@trezor/blockchain-link-types';
import { type ComposeOutput, type FeeLevel, type PROTO } from '@trezor/connect';
import {
    ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT,
    calculateTotalGasCost,
    getApprovalComposeOutput,
    getEthereumEstimateFeeParams,
    prepareEthereumTransaction,
} from '@trezor/network-ethereum-suite-common';
import {
    calculateMax,
    calculateTotal,
    findToken,
    getExternalComposeOutput,
    getMaxAmountWithReserve,
    isNetworkReserveApplicable,
    toMevProtectedPushData,
} from '@trezor/network-module-suite-common-types';
import { BigNumber, typedObjectKeys } from '@trezor/utils';

import { formatNetworkAmount, networkAmountToSmallestUnit } from './amountUtils';
import { isBaseCurrencyWithSats } from './baseCurrency';
import { fromWei } from './ethConverter';
import { isEip1559 } from './ethUtils';

export { calculateMax, calculateTotal };

// EVM SPECIFIC

export {
    calculateTotalGasCost,
    getApprovalComposeOutput,
    getEthereumEstimateFeeParams,
    prepareEthereumTransaction,
};

export const getGasLimitWithBuffer = (estimatedGasLimit: string | undefined) => {
    const estimate = estimatedGasLimit ? new BigNumber(estimatedGasLimit) : null;

    if (!estimate || estimate.isNaN() || estimate.lte(0)) {
        return ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT;
    }

    return estimate
        .multipliedBy(ETH_ESTIMATED_GAS_LIMIT_MULTIPLIER)
        .integerValue(BigNumber.ROUND_CEIL)
        .toFixed();
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

            const feePerUnitInGwei = fromWei(feePerUnit).toGwei();
            const maxFeePerGasInGwei = maxFeePerGas ? fromWei(maxFeePerGas).toGwei() : undefined;
            const maxPriorityFeePerGasInGwei = maxPriorityFeePerGas
                ? fromWei(maxPriorityFeePerGas).toGwei()
                : undefined;
            const baseFeePerGasInGwei = baseFeePerGas ? fromWei(baseFeePerGas).toGwei() : undefined;

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
    if (networkType === 'solana' || networkType === 'tron') {
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

export { findToken };

// BTC composeTransaction
// returns ComposeOutput[]
export const getBitcoinComposeOutputs = (
    values: Partial<FormState>,
    symbol: Account['symbol'],
    isSatoshis?: boolean,
) => {
    const result: ComposeOutput[] = [];
    if (!values || !Array.isArray(values.outputs) || values.transactionData) return result;

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
        (o, i) => setMaxOutputId !== i && o?.address && !o.amount,
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
export { getExternalComposeOutput };

export const restoreOrigOutputsOrder = (
    outputs: PROTO.TxOutputType[],
    origOutputs: RbfTransactionParams['outputs'],
    origTxid: string,
): PROTO.TxOutputType[] => {
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
    networkType?: NetworkType,
): FormState => {
    const isDestinationTagEnabledByDefault = networkType === 'ripple' || networkType === 'stellar';

    return {
        ...DEFAULT_VALUES,
        options: isDestinationTagEnabledByDefault ? ['broadcast', 'destinationTag'] : ['broadcast'],
        outputs: [{ ...DEFAULT_PAYMENT, currency }],
        selectedUtxos: [],
    };
};

type BuildCurrencyOptionParams = {
    currency: BaseCurrencyCode | '' | undefined;
    areSatsDisplayed: boolean;
};

export const buildCurrencyShortOption = ({
    currency,
    areSatsDisplayed,
}: BuildCurrencyOptionParams): BaseCurrencyOption => {
    if (!currency || !isBaseCurrencyCode(currency)) return { value: '', label: '' };

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

    if (!currency || !isBaseCurrencyCode(currency)) return shortOption;
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
    { type: 'ok' } | { type: 'not_enough' } | { type: 'reserve'; reserve: string };

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

/** @deprecated Use `toMevProtectedPushData`; the network does not change the pushed data. */
export const getMevProtectedTxData = (
    _symbol: NetworkSymbol,
    hex: string,
    isMevProtectionEnabled: boolean,
) => toMevProtectedPushData(hex, isMevProtectionEnabled);

export const isExchangeTradingForm = (
    form: FormStateTrading | undefined,
): form is FormStateTradingExchange =>
    form?.activeSection === 'exchange' && 'send' in form && 'receive' in form;

export const isCompleteTradingForm = (
    form: FormStateTrading | undefined,
): form is FormStateTradingSell | FormStateTradingExchange =>
    form !== undefined && 'send' in form && 'receive' in form;

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
    if (!isNetworkReserveApplicable(contractAddress, isEnabled)) return undefined;
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
    fee,
    isNetworkReserveEnabled,
}: GetCryptoMaxAmountWithReserveProps) =>
    getMaxAmountWithReserve({
        networkReserve: getNetworkReserve({
            symbol,
            contractAddress,
            isEnabled: isNetworkReserveEnabled,
        }),
        balance,
        amount,
        fee,
    });

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
