import { getNetworkByCoingeckoNativeId, networks } from '@suite-common/wallet-config';
import { CoinInfo, CryptoId } from 'invity-api';
import { useCallback } from 'react';
import { useSelector } from 'src/hooks/suite/useSelector';
import addressValidator from '@trezor/address-validator';
import {
    CoinmarketCryptoSelectItemProps,
    CoinmarketCryptoSelectOptionProps,
    CoinmarketInfoProps,
} from 'src/types/coinmarket/coinmarket';
import { parseCryptoId, testnetToProdCryptoId } from 'src/utils/wallet/coinmarket/coinmarketUtils';

const supportedAddressValidatorSymbols = new Set(
    addressValidator.getCurrencies().map(c => c.symbol),
);

function toCryptoOption(cryptoId: CryptoId, coinInfo: CoinInfo): CoinmarketCryptoSelectItemProps {
    const { networkId, contractAddress } = parseCryptoId(cryptoId);

    return {
        type: 'currency',
        value: cryptoId,
        label: coinInfo.symbol.toUpperCase(),
        cryptoName: coinInfo.name,
        coingeckoId: networkId,
        contractAddress,
    };
}

const sortPopularCurrencies = (
    a: CoinmarketCryptoSelectItemProps,
    b: CoinmarketCryptoSelectItemProps,
) => {
    const order = ['bitcoin', 'ethereum', 'litecoin', 'cardano', 'solana'];

    const indexA = order.indexOf(a.coingeckoId);
    const indexB = order.indexOf(b.coingeckoId);

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    return 0;
};

export const useCoinmarketInfo = (): CoinmarketInfoProps => {
    const { platforms = {}, coins = {} } = useSelector(state => state.wallet.coinmarket.info);

    const cryptoIdToPlatformName = useCallback(
        (cryptoId: CryptoId) => platforms[cryptoId]?.name,
        [platforms],
    );

    const cryptoIdToCoinName = useCallback((cryptoId: CryptoId) => coins[cryptoId]?.name, [coins]);

    const cryptoIdToNativeCoinSymbol = useCallback(
        (cryptoId: CryptoId) => {
            const { networkId } = parseCryptoId(cryptoId);

            return platforms[networkId]?.nativeCoinSymbol ?? coins[networkId]?.symbol;
        },
        [platforms, coins],
    );

    const cryptoIdToCoinSymbol = useCallback(
        (cryptoId: CryptoId) => coins[cryptoId]?.symbol?.toUpperCase(),
        [coins],
    );

    const buildCryptoOptions = useCallback(
        (
            cryptoIds: Set<CryptoId>,
            excludedCryptoIds?: Set<CryptoId>,
        ): CoinmarketCryptoSelectOptionProps[] => {
            const popularCurrencies: CoinmarketCryptoSelectItemProps[] = [];
            const otherCurrencies: CoinmarketCryptoSelectItemProps[] = [];
            const tokenGroups: CoinmarketCryptoSelectOptionProps[][] = [];

            cryptoIds.forEach(cryptoId => {
                const coinInfo = coins[cryptoId];
                if (!coinInfo) {
                    return;
                }

                if (excludedCryptoIds?.has(cryptoId)) {
                    return;
                }

                const nativeCoinSymbol = cryptoIdToNativeCoinSymbol(
                    testnetToProdCryptoId(cryptoId),
                );
                if (!nativeCoinSymbol || !supportedAddressValidatorSymbols.has(nativeCoinSymbol)) {
                    return;
                }

                const { networkId, contractAddress } = parseCryptoId(cryptoId);
                const option = toCryptoOption(cryptoId, coinInfo);

                if (getNetworkByCoingeckoNativeId(cryptoId)) {
                    popularCurrencies.push(option);
                } else if (!contractAddress) {
                    otherCurrencies.push(option);
                } else {
                    const networkName = cryptoIdToPlatformName(networkId) || networkId;
                    const tokenGroup = tokenGroups.find(group =>
                        group.find(item => item.networkName === networkName),
                    );
                    const optionWithNetwork = {
                        ...option,
                        networkName,
                        coingeckoId: networkId,
                        contractAddress,
                    };

                    if (!tokenGroup) {
                        tokenGroups.push([
                            {
                                type: 'group',
                                label: 'TR_COINMARKET_NETWORK_TOKENS',
                                coingeckoId: networkId,
                                networkName,
                            },
                            {
                                ...optionWithNetwork,
                            },
                        ]);
                    } else {
                        tokenGroup.push(optionWithNetwork);
                    }
                }
            });

            popularCurrencies.sort(sortPopularCurrencies);

            return [
                { type: 'group', label: 'TR_COINMARKET_POPULAR_CURRENCIES' },
                ...popularCurrencies,
                { type: 'group', label: 'TR_COINMARKET_OTHER_CURRENCIES' },
                ...otherCurrencies,

                ...tokenGroups.flat(),
            ];
        },
        [coins, cryptoIdToPlatformName, cryptoIdToNativeCoinSymbol],
    );

    const buildDefaultCryptoOption = useCallback(
        (cryptoId: CryptoId | undefined) => {
            const coinInfo = cryptoId && coins[cryptoId];
            if (coinInfo) {
                return toCryptoOption(cryptoId, coinInfo);
            }

            const { coingeckoId, name } = networks.btc;
            const item: CoinmarketCryptoSelectItemProps = {
                type: 'currency',
                value: cryptoId,
                label: 'BTC',
                cryptoName: name,
                coingeckoId,
            };

            return item;
        },
        [coins],
    );

    return {
        cryptoIdToPlatformName,
        cryptoIdToCoinName,
        cryptoIdToCoinSymbol,
        cryptoIdToNativeCoinSymbol,
        buildCryptoOptions,
        buildDefaultCryptoOption,
    };
};
