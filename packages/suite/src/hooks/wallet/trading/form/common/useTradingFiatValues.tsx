import { useCallback, useEffect } from 'react';

import { FiatCurrencyCode } from 'invity-api';

import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { selectFiatRatesByFiatRateKey, updateFiatRatesThunk } from '@suite-common/wallet-core';
import { FiatRatesResult, Rate, Timestamp, TokenAddress } from '@suite-common/wallet-types';
import { amountToSmallestUnit, getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { CoinmarketAccountOptionsGroupOptionProps } from 'src/types/coinmarket/coinmarket';
import {
    cryptoIdToSymbol,
    mapTestnetSymbol,
    getCoinmarketNetworkDecimals,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';

interface CoinmarketBalanceProps {
    sendCryptoSelect?: CoinmarketAccountOptionsGroupOptionProps;
    fiatCurrency?: FiatCurrencyCode;
}

interface CoinmarketBalanceReturnProps {
    fiatValue: string | null;
    fiatRate: Rate | undefined;
    accountBalance: string;
    formattedBalance: string;
    symbol: NetworkSymbol;
    networkDecimals: number;
    tokenAddress: TokenAddress | undefined;
    fiatRatesUpdater: (value: FiatCurrencyCode | undefined) => Promise<FiatRatesResult | null>;
}

export const useCoinmarketFiatValues = ({
    sendCryptoSelect,
    fiatCurrency,
}: CoinmarketBalanceProps): CoinmarketBalanceReturnProps | null => {
    const dispatch = useDispatch();
    const defaultCryptoSymbol = 'btc';
    const symbol = sendCryptoSelect
        ? cryptoIdToSymbol(sendCryptoSelect.value) ?? defaultCryptoSymbol
        : defaultCryptoSymbol;
    const tokenAddressTyped = (sendCryptoSelect?.contractAddress ?? undefined) as
        | TokenAddress
        | undefined;
    const symbolForFiat = mapTestnetSymbol(symbol);
    const localCurrency = useSelector(selectLocalCurrency);
    const fiatRateKey = getFiatRateKey(
        symbolForFiat,
        fiatCurrency ?? localCurrency,
        tokenAddressTyped,
    );
    const fiatRate = useSelector(state => selectFiatRatesByFiatRateKey(state, fiatRateKey));
    const balance = sendCryptoSelect?.balance;

    const network = networks[symbol];
    const { shouldSendInSats } = useBitcoinAmountUnit(symbol);

    const fiatRatesUpdater = useCallback(
        async (value: FiatCurrencyCode | undefined): Promise<FiatRatesResult | null> => {
            if (!value) return null;

            const updateFiatRatesResult = await dispatch(
                updateFiatRatesThunk({
                    tickers: [
                        {
                            symbol,
                            tokenAddress: tokenAddressTyped,
                        },
                    ],
                    localCurrency: value,
                    rateType: 'current',
                    fetchAttemptTimestamp: Date.now() as Timestamp,
                }),
            );

            if (updateFiatRatesResult.meta.requestStatus !== 'fulfilled') return null;

            return updateFiatRatesResult.payload as FiatRatesResult;
        },
        [dispatch, symbol, tokenAddressTyped],
    );

    // update rates on mount
    useEffect(() => {
        fiatRatesUpdater(fiatCurrency);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!balance || !fiatCurrency) return null;

    const decimals = getCoinmarketNetworkDecimals({
        sendCryptoSelect,
        network,
    });
    const formattedBalance = shouldSendInSats ? amountToSmallestUnit(balance, decimals) : balance;
    const fiatValue = toFiatCurrency(balance, fiatRate?.rate, 2);

    return {
        fiatValue,
        fiatRate,
        accountBalance: balance,
        formattedBalance,
        symbol,
        networkDecimals: decimals,
        tokenAddress: tokenAddressTyped,
        fiatRatesUpdater,
    };
};
