import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    asAmountUnit,
    fromBaseCurrencyToCryptoUnit,
    getCryptoAmountWithReserve,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

type CalcCryptoFromFiatParams = {
    fiatAmount: string;
    rate: number | undefined;
    networkDecimals: number;
    shouldSendInSats: boolean | undefined;
};

export const calcCryptoFromFiat = ({
    fiatAmount,
    rate,
    networkDecimals,
    shouldSendInSats,
}: CalcCryptoFromFiatParams): string => {
    const cryptoAmount =
        fromBaseCurrencyToCryptoUnit({ fiatAmount, rate })?.toFixed(networkDecimals) ?? null;

    if (!cryptoAmount) {
        return '';
    }

    return shouldSendInSats
        ? unitsToSubunits({
              value: asAmountUnit(new BigNumber(cryptoAmount)),
              decimals: networkDecimals,
          }).toString()
        : cryptoAmount;
};

type CalcRatioAmountParams = {
    divisor: number;
    balance: string;
    decimals: number;
    networkDecimals: number;
    shouldSendInSats: boolean | undefined;
    isNetworkReserveEnabled: boolean;
    symbol: NetworkSymbol;
    contractAddress: string | null | undefined;
    formattedBalance: string;
    fee: string | undefined;
};

export const calcRatioAmount = ({
    divisor,
    balance,
    decimals,
    networkDecimals,
    shouldSendInSats,
    isNetworkReserveEnabled,
    symbol,
    contractAddress,
    formattedBalance,
    fee,
}: CalcRatioAmountParams): { cryptoInputValue: string; cryptoAmountWithReserve: string } => {
    const amount = new BigNumber(balance || '0').dividedBy(divisor).decimalPlaces(decimals);

    const cryptoInputValue = shouldSendInSats
        ? unitsToSubunits({ value: asAmountUnit(amount), decimals: networkDecimals }).toString()
        : amount.toString();

    const cryptoAmountWithReserve = isNetworkReserveEnabled
        ? getCryptoAmountWithReserve({
              symbol,
              contractAddress,
              balance: formattedBalance,
              amount: cryptoInputValue,
              fee,
              isNetworkReserveEnabled,
          })
        : cryptoInputValue;

    return { cryptoInputValue, cryptoAmountWithReserve };
};

type CalcMaxTokenAmountParams = {
    balance: string;
    decimals: number;
    networkDecimals: number;
    shouldSendInSats: boolean | undefined;
};

export const calcMaxTokenAmount = ({
    balance,
    decimals,
    networkDecimals,
    shouldSendInSats,
}: CalcMaxTokenAmountParams): string => {
    const maxAmount = new BigNumber(balance || '0').decimalPlaces(decimals);

    return shouldSendInSats
        ? unitsToSubunits({ value: asAmountUnit(maxAmount), decimals: networkDecimals }).toString()
        : maxAmount.toString();
};
