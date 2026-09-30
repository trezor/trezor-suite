import { useSelector } from 'react-redux';

import { getNetworkDisplaySymbol, getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { isErc4626 } from '@suite-common/wallet-utils';
import { AssetPriceChange } from '@suite-native/assets';
import { Box, Card, HStack, Text, VStack } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';
import { isWrappedNativeToken } from '@trezor/network-ethereum-suite-common';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useDayCoinPriceChange } from '../hooks/useDayCoinPriceChange';

const cardStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItem: 'center',
    padding: utils.spacings.sp16,
    backgroundColor: utils.colors.surfaceFillRaised,
    borderRadius: utils.borders.radii.r16,
}));

const cardContentStyle = prepareNativeStyle(_ => ({
    flexShrink: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
}));

type AssetPriceCardProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const AssetPriceCard = ({ accountKey, tokenContract }: AssetPriceCardProps) => {
    const { applyStyle } = useNativeStyles();

    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const token = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, accountKey, tokenContract),
    );

    const isErc4626Token = isErc4626(token);

    const { currentValue, valuePercentageChange, isLoading, underlyingAssetContract } =
        useDayCoinPriceChange({
            symbol: networkSymbol,
            tokenContract,
            isErc4626Token,
        });

    if (!networkSymbol) return null;
    if (!isLoading && currentValue === null) return null;

    const tokenName = token?.name ?? token?.symbol ?? getNetworkDisplaySymbol(networkSymbol);

    const priceContract = isErc4626Token ? underlyingAssetContract : tokenContract;
    const isCoinPrice = !priceContract || isWrappedNativeToken(networkSymbol, priceContract);
    const isUnderlyingAssetResolving = isErc4626Token && underlyingAssetContract === null;

    return (
        <VStack marginHorizontal="sp16">
            <Text variant="headline-sm">
                <Translation id="moduleAccountManagement.accountDetailContentScreen.assetPrice" />
            </Text>

            <Card style={applyStyle(cardStyle)} noShadow>
                <HStack alignItems="center" justifyContent="space-between" flex={1}>
                    <HStack alignItems="center" flex={1}>
                        <Box marginRight="sp6">
                            <TokenIcon
                                networkSymbol={networkSymbol}
                                contractAddress={tokenContract}
                                tokenSymbol={token?.symbol || token?.name}
                                showNetworkIcon
                                size="medium"
                            />
                        </Box>

                        <Box style={applyStyle(cardContentStyle)}>
                            <Text variant="body-sm-strong" color="contentPrimary">
                                {tokenName}
                            </Text>

                            <Text variant="body-sm" color="contentSecondary">
                                {getNetworkDisplaySymbolName(networkSymbol)}
                            </Text>
                        </Box>
                    </HStack>

                    <Box alignItems="flex-end">
                        <BaseCurrencyAmountFormatter
                            symbol={networkSymbol}
                            value={currentValue}
                            variant="body-sm-strong"
                            isDiscreetText={false}
                            isLoading={isLoading || isUnderlyingAssetResolving}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            maximumFractionDigits={isCoinPrice ? 2 : 8}
                        />

                        {!isErc4626Token && (
                            <AssetPriceChange percentageChange={valuePercentageChange} />
                        )}
                    </Box>
                </HStack>
            </Card>
        </VStack>
    );
};
