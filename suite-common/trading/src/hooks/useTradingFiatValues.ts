import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import type { CryptoId } from 'invity-api';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type FiatRatesRootState,
    fiatRatesApi,
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
    useFiatRate,
} from '@suite-common/wallet-core';
import { type FiatRatesResult, type Rate, type TokenAddress } from '@suite-common/wallet-types';
import {
    convertAmountUnitsToSubunits,
    getFiatRateKey,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { TRADING_DEFAULT_CRYPTO_CURRENCY } from '../constants';
import { type TradingRootState } from '../reducers/tradingCommonReducer';
import {
    cryptoIdToNetworkAndContractAddress,
    isCryptoIdForNativeToken,
    mapTestnetSymbol,
} from '../utils';

export interface TradingFiatRatesProps {
    fiatCurrency?: BaseCurrencyCode;
    cryptoId?: CryptoId;
    amount?: string;
    shouldSendInSats?: boolean;
    isErc4626?: boolean;
}

export interface TradingFiatRatesReturn {
    fiatValue: string | null;
    fiatRate: Rate | undefined;
    accountBalance: string;
    formattedBalance: string;
    symbol: NetworkSymbol;
    networkDecimals: number;
    tokenAddress: TokenAddress | undefined;
    fiatRatesUpdater: (
        value: BaseCurrencyCode | undefined,
        currentTokenAddress?: TokenAddress,
    ) => Promise<FiatRatesResult | null>;
}

export const useTradingFiatValues = ({
    cryptoId,
    fiatCurrency,
    amount,
    shouldSendInSats,
    isErc4626,
}: TradingFiatRatesProps): TradingFiatRatesReturn | null => {
    const { dispatch } = useServices(injectDispatch);

    const isNativeToken = cryptoId && isCryptoIdForNativeToken(cryptoId);

    const { network, contractAddress, symbol } = useMemo(() => {
        const assetInfo = cryptoId && cryptoIdToNetworkAndContractAddress(cryptoId);

        return {
            network: assetInfo?.network,
            contractAddress: isNativeToken ? undefined : assetInfo?.contractAddress,
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

    const fiatRate = useSelector((state: TradingRootState & FiatRatesRootState) =>
        selectFiatRatesByFiatRateKey(state, fiatRateKey),
    );

    const fiatRatesUpdater = useCallback(
        async (
            value: BaseCurrencyCode | undefined,
            currentTokenAddress?: TokenAddress,
        ): Promise<FiatRatesResult | null> => {
            if (!value) return null;
            const tokenAddress = currentTokenAddress ?? contractAddress;

            try {
                return await dispatch(
                    fiatRatesApi.endpoints.getCurrentFiatRate.initiate(
                        {
                            ticker: {
                                symbol: symbolForFiat,
                                tokenAddress: isNativeToken ? undefined : tokenAddress,
                                protocols: isErc4626 ? ['erc4626'] : undefined,
                            },
                            baseCurrencyCode: value,
                            forceFetchToken: true,
                            skipCache: true,
                        },
                        { subscribe: false, forceRefetch: true },
                    ),
                ).unwrap();
            } catch {
                return null;
            }
        },
        [contractAddress, dispatch, symbolForFiat, isNativeToken, isErc4626],
    );

    // Trading needs a fresh rate of the asset, also for tokens without a known coin definition.
    useFiatRate({
        ticker: {
            symbol: symbolForFiat,
            tokenAddress: contractAddress,
            protocols: isErc4626 ? ['erc4626'] : undefined,
        },
        baseCurrencyCode: fiatCurrency,
        forceFetchToken: true,
        skipCache: true,
        isDisabled: !fiatCurrency,
    });

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
