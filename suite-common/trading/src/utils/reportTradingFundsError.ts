import { captureException, withScope } from '@sentry/core';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type FeeInfo,
    type FormState,
    type FormStateTrading,
    type PrecomposedLevels,
    type PrecomposedLevelsCardano,
    type PrecomposedTransactionError,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { type FeeLevel } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

const UNKNOWN = 'unknown';

const TRADING_FUNDS_ERRORS: PrecomposedTransactionError['error'][] = [
    'AMOUNT_IS_NOT_ENOUGH',
    'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
    'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT',
];

export const isTradingFundsError = (error: string) =>
    TRADING_FUNDS_ERRORS.some(fundsError => fundsError === error);

type TradingGasCost = {
    feeLimit: string | undefined;
    feePerGas: string | undefined;
};

export type ReportTradingFundsErrorParams = {
    symbol: NetworkSymbol;
    accountType: Account['accountType'];
    composeError: string;
    tradeType: FormStateTrading['activeSection'];
    provider: string | undefined;
    isDexTrade: boolean;
    isTokenTrade: boolean;
    isMaxAmount: boolean;
    selectedFee: FeeLevel['label'];
    reserved: TradingGasCost;
    required: TradingGasCost;
};

const getGasCost = ({ feeLimit, feePerGas }: TradingGasCost) =>
    feeLimit && feePerGas ? new BigNumber(feeLimit).multipliedBy(feePerGas) : undefined;

const getRequiredOverReserved = (reserved: TradingGasCost, required: TradingGasCost) => {
    const reservedCost = getGasCost(reserved);
    const requiredCost = getGasCost(required);

    if (!reservedCost?.isGreaterThan(0) || !requiredCost) {
        return undefined;
    }

    return requiredCost.dividedBy(reservedCost).toFixed(4);
};

type TradingFundsErrorComposed = Pick<
    PrecomposedTransactionFinal,
    'feeLimit' | 'feePerByte' | 'max' | 'maxFeePerGas' | 'token'
>;

type GetTradingFundsErrorReportParams = {
    account: Pick<Account, 'symbol' | 'accountType'>;
    activeSection: FormStateTrading['activeSection'];
    composeError: string;
    composed: TradingFundsErrorComposed;
    composedLevels: PrecomposedLevels | PrecomposedLevelsCardano;
    feeInfo: Pick<FeeInfo, 'levels'>;
    formState: Pick<
        FormState,
        'ethereumAdjustGasLimit' | 'feeLimit' | 'feePerUnit' | 'maxFeePerGas'
    >;
    provider: string | undefined;
    selectedFee: FeeLevel['label'];
};

export const getTradingFundsErrorReport = ({
    account,
    activeSection,
    composeError,
    composed,
    composedLevels,
    feeInfo,
    formState,
    provider,
    selectedFee,
}: GetTradingFundsErrorReportParams): ReportTradingFundsErrorParams => {
    const composedLevel = Object.values(composedLevels).find(level => level.type !== 'error');
    const feeLevel = feeInfo.levels.find(level => level.label === selectedFee);
    const isCustomFee = selectedFee === 'custom';

    return {
        symbol: account.symbol,
        accountType: account.accountType,
        composeError,
        tradeType: activeSection,
        provider,
        isDexTrade: !!formState.ethereumAdjustGasLimit,
        isTokenTrade: !!composed.token?.contract,
        isMaxAmount: composed.max !== undefined,
        selectedFee,
        reserved: {
            feeLimit: composed.feeLimit,
            feePerGas: composed.maxFeePerGas ?? composed.feePerByte,
        },
        required: {
            feeLimit: isCustomFee ? formState.feeLimit : composedLevel?.feeLimit,
            feePerGas: isCustomFee
                ? (formState.maxFeePerGas ?? formState.feePerUnit)
                : (feeLevel?.maxFeePerGas ?? feeLevel?.feePerUnit),
        },
    };
};

export const reportTradingFundsError = ({
    symbol,
    accountType,
    composeError,
    tradeType,
    provider,
    isDexTrade,
    isTokenTrade,
    isMaxAmount,
    selectedFee,
    reserved,
    required,
}: ReportTradingFundsErrorParams) => {
    withScope(scope => {
        scope.setTag('error.code', 'trading_funds_error');
        scope.setTag('trade.type', tradeType);
        scope.setTag('trade.provider', provider ?? UNKNOWN);
        scope.setTag('trade.isDex', isDexTrade);
        scope.setTag('trade.isToken', isTokenTrade);
        scope.setTag('trade.isMaxAmount', isMaxAmount);
        scope.setTag('fee.network', symbol);
        scope.setTag('fee.accountType', accountType);
        scope.setTag('fee.selectedFee', selectedFee);
        scope.setTag('fee.feeLimitReserved', reserved.feeLimit ?? UNKNOWN);
        scope.setTag('fee.feeLimitRequired', required.feeLimit ?? UNKNOWN);
        scope.setTag('fee.feePerGasReserved', reserved.feePerGas ?? UNKNOWN);
        scope.setTag('fee.feePerGasRequired', required.feePerGas ?? UNKNOWN);
        scope.setTag(
            'fee.requiredOverReserved',
            getRequiredOverReserved(reserved, required) ?? UNKNOWN,
        );
        captureException(new Error(`Trading transaction rejected at confirm: ${composeError}`));
    });
};
