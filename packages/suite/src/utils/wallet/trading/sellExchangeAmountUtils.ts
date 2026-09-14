import { type NetworkConfigDeps } from '@suite-common/networks';
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

export const calcCryptoFromFiat = (
    networkConfigDeps: NetworkConfigDeps,
    { fiatAmount, rate, networkDecimals, shouldSendInSats }: CalcCryptoFromFiatParams,
): string => {
    const cryptoAmount =
        fromBaseCurrencyToCryptoUnit({ fiatAmount, rate })?.toFixed(networkDecimals) ?? null;

    if (!cryptoAmount) {
        return '';
    }

    return shouldSendInSats
        ? unitsToSubunits(networkConfigDeps, {
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

export const calcRatioAmount = (
    networkConfigDeps: NetworkConfigDeps,
    {
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
    }: CalcRatioAmountParams,
): { cryptoInputValue: string; cryptoAmountWithReserve: string } => {
    const amount = new BigNumber(balance || '0').dividedBy(divisor).decimalPlaces(decimals);

    const cryptoInputValue = shouldSendInSats
        ? unitsToSubunits(networkConfigDeps, {
              value: asAmountUnit(amount),
              decimals: networkDecimals,
          }).toString()
        : amount.toString();

    const cryptoAmountWithReserve = isNetworkReserveEnabled
        ? getCryptoAmountWithReserve(networkConfigDeps, {
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

export const calcMaxTokenAmount = (
    networkConfigDeps: NetworkConfigDeps,
    { balance, decimals, networkDecimals, shouldSendInSats }: CalcMaxTokenAmountParams,
): string => {
    const maxAmount = new BigNumber(balance || '0').decimalPlaces(decimals);

    return shouldSendInSats
        ? unitsToSubunits(networkConfigDeps, {
              value: asAmountUnit(maxAmount),
              decimals: networkDecimals,
          }).toString()
        : maxAmount.toString();
};
