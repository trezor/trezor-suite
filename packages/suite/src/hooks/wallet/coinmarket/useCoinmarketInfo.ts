import { getNetworkByCoingeckoId, networks } from '@suite-common/wallet-config';
import { CoinInfo, CryptoId } from 'invity-api';
import { useCallback } from 'react';
import { useSelector } from 'src/hooks/suite/useSelector';
import {
    CoinmarketCryptoListProps,
    CoinmarketInfoProps,
    CoinmarketOptionsGroupProps,
} from 'src/types/coinmarket/coinmarket';
import { parseCryptoId } from 'src/utils/wallet/coinmarket/coinmarketUtils';

function toCryptoOption(cryptoId: CryptoId, coinInfo: CoinInfo): CoinmarketCryptoListProps {
    return {
        value: cryptoId,
        label: coinInfo.symbol.toUpperCase(),
        cryptoName: coinInfo.name,
    };
}

export const useCoinmarketInfo = (): CoinmarketInfoProps => {
    const { platforms = {}, coins = {} } = useSelector(state => state.wallet.coinmarket.info);

    const getNetworkName = useCallback(
        (cryptoId: CryptoId) => platforms[cryptoId]?.name,
        [platforms],
    );

    const getNetworkSymbol = useCallback(
        (cryptoId: CryptoId) => coins[cryptoId]?.symbol?.toUpperCase(),
        [coins],
    );

    const buildCryptoOptions = useCallback(
        (cryptoIds: Set<CryptoId>): CoinmarketOptionsGroupProps[] => {
            const popularCurrencies: CoinmarketCryptoListProps[] = [];
            const otherCurrencies: CoinmarketCryptoListProps[] = [];
            const tokenGroups: CoinmarketOptionsGroupProps[] = [];

            cryptoIds.forEach(cryptoId => {
                const coinInfo = coins[cryptoId];
                if (!coinInfo) {
                    return;
                }

                const { networkId, contractAddress } = parseCryptoId(cryptoId);
                const option = toCryptoOption(cryptoId, coinInfo);

                if (getNetworkByCoingeckoId(cryptoId)) {
                    popularCurrencies.push(option);
                } else if (!contractAddress) {
                    otherCurrencies.push(option);
                } else {
                    const networkName = getNetworkName(networkId) || networkId;
                    let tokenGroup = tokenGroups.find(g => g.networkName === networkName);
                    if (!tokenGroup) {
                        tokenGroup = {
                            translationId: 'TR_COINMARKET_NETWORK_TOKENS',
                            networkName,
                            options: [],
                        };
                        tokenGroups.push(tokenGroup);
                    }
                    tokenGroup.options.push(option);
                }
            });

            return [
                { translationId: 'TR_COINMARKET_POPULAR_CURRENCIES', options: popularCurrencies },
                { translationId: 'TR_COINMARKET_OTHER_CURRENCIES', options: otherCurrencies },
                ...tokenGroups,
            ];
        },
        [coins, getNetworkName],
    );

    const buildDefaultCryptoOption = useCallback(
        (cryptoId: CryptoId) => {
            const coinInfo = coins[cryptoId];
            if (coinInfo) {
                return toCryptoOption(cryptoId, coinInfo);
            }

            const { coingeckoId, name } = networks.btc;

            return {
                value: coingeckoId as CryptoId,
                label: 'BTC',
                cryptoName: name,
            };
        },
        [coins],
    );

    return {
        getNetworkName,
        getNetworkSymbol,
        buildCryptoOptions,
        buildDefaultCryptoOption,
    };
};
