import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    getNetworkDisplaySymbol,
    getNetworkDisplaySymbolName,
    isWrappedNativeToken,
} from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { isErc4626 } from '@suite-common/wallet-utils';
import { Box, Card, HStack, Text, VStack } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';
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

const percentFormatter = new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumSignificantDigits: 3,
    minimumSignificantDigits: 3,
});

interface PriceChangeLabelProps {
    valuePercentageChange: number | null;
}

const PriceChangeLabel = ({ valuePercentageChange }: PriceChangeLabelProps) => {
    const percentageChange = valuePercentageChange ?? 0;
    const formattedPercentage = percentFormatter.format(percentageChange);

    const textColor = useMemo(() => {
        if (percentageChange === 0) return 'contentSecondary';

        return percentageChange > 0 ? 'contentBrand' : 'contentCritical';
    }, [percentageChange]);

    return (
        <Text variant="body-sm" priority="primary" color={textColor}>
            {percentageChange > 0 ? '+' : ''}
            {formattedPercentage}
        </Text>
    );
};

interface AssetPriceCardProps {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
}

export const AssetPriceCard = ({ accountKey, tokenContract }: AssetPriceCardProps) => {
    const { applyStyle } = useNativeStyles();

    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const token = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, accountKey, tokenContract),
    );

    const isErc4626Token = isErc4626(token);

    const { currentValue, valuePercentageChange, isLoading, underlyingAssetContract } =
        useDayCoinPriceChange({
            symbol,
            tokenContract,
            isErc4626Token,
        });

    if (!symbol) return null;
    if (!isLoading && currentValue === null) return null;

    const tokenName = token?.name ?? token?.symbol ?? getNetworkDisplaySymbol(symbol);

    const priceContract = isErc4626Token ? underlyingAssetContract : tokenContract;
    const isCoinPrice = !priceContract || isWrappedNativeToken(symbol, priceContract);
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
                                symbol={symbol}
                                contractAddress={tokenContract}
                                showNetworkIcon
                                size="medium"
                            />
                        </Box>

                        <Box style={applyStyle(cardContentStyle)}>
                            <Text variant="body-sm-strong" color="contentPrimary">
                                {tokenName}
                            </Text>

                            <Text variant="body-sm" color="contentSecondary">
                                {getNetworkDisplaySymbolName(symbol)}
                            </Text>
                        </Box>
                    </HStack>

                    <Box alignItems="flex-end">
                        <BaseCurrencyAmountFormatter
                            symbol={symbol}
                            value={currentValue}
                            variant="body-sm-strong"
                            isDiscreetText={false}
                            isLoading={isLoading || isUnderlyingAssetResolving}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            maximumFractionDigits={isCoinPrice ? 2 : 8}
                        />

                        {!isErc4626Token && (
                            <HStack>
                                <Text variant="body-sm" color="contentSecondary">
                                    <Translation id="moduleAccountManagement.accountDetailContentScreen.assetPriceCard.changeIn7d" />
                                </Text>

                                <PriceChangeLabel valuePercentageChange={valuePercentageChange} />
                            </HStack>
                        )}
                    </Box>
                </HStack>
            </Card>
        </VStack>
    );
};
