import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { selectFiatRatesByFiatRateKey, updateFiatRatesThunk } from '@suite-common/wallet-core';
import { FiatRatesResult, Rate, Timestamp, TokenAddress } from '@suite-common/wallet-types';
import { amountToSatoshi, getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';
import { CryptoId, FiatCurrencyCode } from 'invity-api';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import {
    cryptoIdToNetworkSymbol,
    mapTestnetSymbol,
    getNetworkDecimals,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';

interface CoinmarketBalanceProps {
    cryptoSymbol: CryptoId | undefined;
    tokenAddress?: string | null;
    accountBalance?: string;
    fiatCurrency?: FiatCurrencyCode;
}

interface CoinmarketBalanceReturnProps {
    fiatValue: string | null;
    fiatRate: Rate | undefined;
    accountBalance: string;
    formattedBalance: string;
    networkSymbol: NetworkSymbol;
    networkDecimals: number;
    tokenAddress: TokenAddress | undefined;
    fiatRatesUpdater: (value: FiatCurrencyCode | undefined) => Promise<FiatRatesResult | null>;
}

export const useCoinmarketFiatValues = ({
    accountBalance,
    cryptoSymbol,
    tokenAddress,
    fiatCurrency,
}: CoinmarketBalanceProps): CoinmarketBalanceReturnProps | null => {
    const dispatch = useDispatch();
    const defaultCryptoSymbol = 'btc';
    const networkSymbol = cryptoSymbol
        ? cryptoIdToNetworkSymbol(cryptoSymbol) ?? defaultCryptoSymbol
        : defaultCryptoSymbol;
    const tokenAddressTyped = tokenAddress as TokenAddress | undefined;
    const symbolForFiat = mapTestnetSymbol(networkSymbol);
    const localCurrency = useSelector(selectLocalCurrency);
    const fiatRateKey = getFiatRateKey(
        symbolForFiat,
        fiatCurrency ?? localCurrency,
        tokenAddressTyped,
    );
    const fiatRate = useSelector(state => selectFiatRatesByFiatRateKey(state, fiatRateKey));

    const network = networks[networkSymbol];
    const { shouldSendInSats } = useBitcoinAmountUnit(networkSymbol);

    const fiatRatesUpdater = useCallback(
        async (value: FiatCurrencyCode | undefined): Promise<FiatRatesResult | null> => {
            if (!value) return null;

            const updateFiatRatesResult = await dispatch(
                updateFiatRatesThunk({
                    ticker: {
                        symbol: networkSymbol,
                        tokenAddress: tokenAddressTyped,
                    },
                    localCurrency: value,
                    rateType: 'current',
                    fetchAttemptTimestamp: Date.now() as Timestamp,
                }),
            );

            if (updateFiatRatesResult.meta.requestStatus !== 'fulfilled') return null;

            return updateFiatRatesResult.payload as FiatRatesResult;
        },
        [dispatch, networkSymbol, tokenAddressTyped],
    );

    // update rates on mount
    useEffect(() => {
        fiatRatesUpdater(fiatCurrency);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!accountBalance || !fiatCurrency) return null;

    const decimals = getNetworkDecimals(network?.decimals);
    const formattedBalance = shouldSendInSats
        ? amountToSatoshi(accountBalance, decimals)
        : accountBalance;
    const fiatValue = toFiatCurrency(accountBalance, fiatRate?.rate, 2);

    return {
        fiatValue,
        fiatRate,
        accountBalance,
        formattedBalance,
        networkSymbol,
        networkDecimals: network.decimals,
        tokenAddress: tokenAddressTyped,
        fiatRatesUpdater,
    };
};
