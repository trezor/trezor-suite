import React from 'react';

import { useFormatters } from '@suite-common/formatters';
import { type EvmAssetDiff, type EvmAssetExposure } from '@suite-common/tx-simulation';
import { type Network, isNetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Box, HStack, Text } from '@suite-native/atoms';
import { CryptoIcon, CryptoIconWithNetwork, Icon } from '@suite-native/icons';
import { BigNumber } from '@trezor/utils';

// FIXME: rename to EvmTxSimulationAsset
export const TxSimulationAsset = ({
    assetDiff,
    assetExposure,
    network,
}: {
    assetDiff?: EvmAssetDiff;
    assetExposure?: EvmAssetExposure;
    network: Network;
}) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();

    const AssetIcon = () => {
        const asset = (assetDiff || assetExposure)?.asset;
        const assetType = (assetDiff || assetExposure)?.asset_type;
        const coinSymbol = asset?.symbol?.toLowerCase();
        if (assetType === 'NATIVE' && coinSymbol && isNetworkSymbol(coinSymbol)) {
            return <CryptoIcon symbol={coinSymbol} size="small" />;
        }
        if (asset?.symbol && 'address' in asset && network.coingeckoId) {
            return (
                <CryptoIconWithNetwork
                    symbol={network.symbol}
                    contractAddress={asset.address.toLowerCase() as TokenAddress}
                    size="small"
                />
            );
        }

        return <Icon name="coins" size="small" />;
    };

    return (
        <HStack spacing="sp12" padding="sp16" alignItems="center">
            <AssetIcon />

            {assetDiff?.in.map((inAmount, inIndex) => (
                <HStack
                    key={`in-${inIndex}`}
                    spacing="sp12"
                    alignItems="center"
                    flex={1}
                    flexWrap="wrap"
                >
                    <Text color="contentBrand">{inAmount.summary}</Text>
                    <Box flex={1} />
                    {inAmount.usd_price && (
                        <Text color="contentSecondary">
                            {`+ `}
                            <BaseCurrencyAmountFormatter
                                value={asBaseCurrencyAmount(new BigNumber(inAmount.usd_price))}
                                currency="USD"
                            />
                        </Text>
                    )}
                </HStack>
            ))}
            {assetDiff?.out.map((outAmount, outIndex) => (
                <HStack
                    key={`out-${outIndex}`}
                    spacing="sp12"
                    alignItems="center"
                    flex={1}
                    flexWrap="wrap"
                >
                    <Text color="contentCritical">{outAmount.summary}</Text>
                    <Box flex={1} />
                    {outAmount.usd_price && (
                        <Text color="contentSecondary">
                            {`- `}
                            <BaseCurrencyAmountFormatter
                                value={asBaseCurrencyAmount(new BigNumber(outAmount.usd_price))}
                                currency="USD"
                            />
                        </Text>
                    )}
                </HStack>
            ))}
            {assetExposure?.spenders &&
                Object.values(assetExposure.spenders).map((spender, index) => (
                    <HStack key={`spender-${index}`} spacing="sp12" alignItems="center" flex={1}>
                        <Text color="contentSecondary">{spender.summary}</Text>
                        <Box flex={1} />
                        {spender.exposure.usd_price && (
                            <Text color="contentSecondary">
                                <BaseCurrencyAmountFormatter
                                    value={spender.exposure.usd_price}
                                    currency="USD"
                                />
                            </Text>
                        )}
                    </HStack>
                ))}
        </HStack>
    );
};
