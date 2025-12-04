import { useCallback, useEffect, useMemo } from 'react';

import { CryptoId, FiatCurrencyCode } from 'invity-api';

import {
    TRADING_DEFAULT_CRYPTO_CURRENCY,
    cryptoIdToNetworkAndContractAddress,
    isCryptoIdForNativeToken,
    mapTestnetSymbol,
} from '@suite-common/trading';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
    updateFiatRatesThunk,
} from '@suite-common/wallet-core';
import { FiatRatesResult, Rate, Timestamp, TokenAddress } from '@suite-common/wallet-types';
import {
    convertAmountUnitsToSubunits,
    getFiatRateKey,
    toFiatCurrency,
} from '@suite-common/wallet-utils';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';

interface TradingBalanceProps {
    fiatCurrency?: FiatCurrencyCode;
    cryptoId?: CryptoId;
    amount?: string;
}

interface TradingBalanceReturnProps {
    fiatValue: string | null;
    fiatRate: Rate | undefined;
    accountBalance: string;
    formattedBalance: string;
    symbol: NetworkSymbol;
    networkDecimals: number;
    tokenAddress: TokenAddress | undefined;
    fiatRatesUpdater: (
        value: FiatCurrencyCode | undefined,
        currentTokenAddress?: TokenAddress,
    ) => Promise<FiatRatesResult | null>;
}

export const useTradingFiatValues = ({
    cryptoId,
    fiatCurrency,
    amount,
}: TradingBalanceProps): TradingBalanceReturnProps | null => {
    const dispatch = useDispatch();

    const isNativeToken = cryptoId && isCryptoIdForNativeToken(cryptoId);

    const { network, contractAddress, symbol } = useMemo(() => {
        const assetInfo = cryptoId && cryptoIdToNetworkAndContractAddress(cryptoId);

        return {
            network: assetInfo?.network,
            contractAddress: isNativeToken
                ? undefined
                : (assetInfo?.contractAddress as TokenAddress | undefined),
            symbol: assetInfo?.network?.symbol ?? TRADING_DEFAULT_CRYPTO_CURRENCY,
        };
    }, [cryptoId, isNativeToken]);

    const symbolForFiat = mapTestnetSymbol(symbol);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const fiatRateKey = getFiatRateKey(
        symbolForFiat,
        fiatCurrency ?? baseCurrencyCode,
        contractAddress,
    );

    const fiatRate = useSelector(state => selectFiatRatesByFiatRateKey(state, fiatRateKey));

    const { shouldSendInSats } = useBitcoinAmountUnit(symbol);

    const fiatRatesUpdater = useCallback(
        async (
            value: FiatCurrencyCode | undefined,
            currentTokenAddress?: TokenAddress,
        ): Promise<FiatRatesResult | null> => {
            if (!value) return null;
            const tokenAddress = currentTokenAddress ?? contractAddress;

            const updateFiatRatesResult = await dispatch(
                updateFiatRatesThunk({
                    tickers: [
                        {
                            symbol,
                            tokenAddress: isNativeToken ? undefined : tokenAddress,
                        },
                    ],
                    baseCurrencyCode: value,
                    rateType: 'current',
                    fetchAttemptTimestamp: Date.now() as Timestamp,
                    forceFetchToken: true,
                    skipCache: true,
                }),
            );

            if (updateFiatRatesResult.meta.requestStatus === 'fulfilled') {
                const fiatRates =
                    updateFiatRatesResult.payload as PromiseSettledResult<FiatRatesResult>[];

                const successfulResult = fiatRates.find(
                    (result): result is PromiseFulfilledResult<FiatRatesResult> =>
                        result.status === 'fulfilled',
                );

                return successfulResult?.value ?? null;
            }

            return null;
        },
        [contractAddress, dispatch, symbol, isNativeToken],
    );

    useEffect(() => {
        if (!fiatCurrency) return;

        fiatRatesUpdater(fiatCurrency);
    }, [fiatCurrency, fiatRatesUpdater]);

    if (!amount || !fiatCurrency || !network) return null;

    const formattedBalance = shouldSendInSats
        ? convertAmountUnitsToSubunits(amount, network.decimals)
        : amount;
    const fiatValue = toFiatCurrency({ amount, rate: fiatRate?.rate })?.toFixed(2) ?? null;

    return {
        fiatValue,
        fiatRate,
        accountBalance: amount,
        formattedBalance,
        symbol,
        networkDecimals: network.decimals,
        tokenAddress: contractAddress,
        fiatRatesUpdater,
    };
};
