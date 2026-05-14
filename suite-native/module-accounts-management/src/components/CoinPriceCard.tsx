import { useSelector } from 'react-redux';

import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { Box, Card, PriceChangeBadge, Text } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { CryptoIconWithNetwork } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useDayCoinPriceChange } from '../hooks/useDayCoinPriceChange';

type CoinPriceCardProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

type PriceChangeIndicatorProps = {
    valuePercentageChange: number | null;
};

const cardStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItem: 'center',
    marginHorizontal: utils.spacings.sp16,
    padding: utils.spacings.sp16,
    backgroundColor: utils.colors.surfaceFillRaised,
    borderRadius: utils.borders.radii.r16,
}));

const cardContentStyle = prepareNativeStyle(_ => ({
    flexShrink: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
}));

const indicatorContainer = prepareNativeStyle(utils => ({
    maxWidth: '40%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: utils.spacings.sp4,
}));

const PriceChangeIndicator = ({ valuePercentageChange }: PriceChangeIndicatorProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(indicatorContainer)}>
            <Text variant="body-xs" color="contentSecondary">
                <Translation id="moduleAccountManagement.accountDetailContentScreen.coinPriceCard.changeIn7d" />
            </Text>
            <PriceChangeBadge valuePercentageChange={valuePercentageChange} />
        </Box>
    );
};

export const CoinPriceCard = ({ accountKey, tokenContract }: CoinPriceCardProps) => {
    const { applyStyle } = useNativeStyles();

    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const token = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, accountKey, tokenContract),
    );
    const { currentValue, valuePercentageChange } = useDayCoinPriceChange(symbol, tokenContract);

    if (!symbol) return null;

    const tokenName = token?.name ?? token?.symbol;
    const mainnetName = getNetworkDisplaySymbolName(symbol);
    const assetName = tokenName ?? mainnetName;

    return (
        <Card style={applyStyle(cardStyle)}>
            <Box flexDirection="row" alignItems="center" flex={1}>
                <Box marginRight="sp16">
                    <CryptoIconWithNetwork symbol={symbol} contractAddress={tokenContract} />
                </Box>
                <Box style={applyStyle(cardContentStyle)}>
                    <Text variant="body-xs" color="contentSecondary">
                        <Translation
                            id="moduleAccountManagement.accountDetailContentScreen.coinPriceCard.coinPrice"
                            values={{ coinName: assetName }}
                        />
                    </Text>
                    <BaseCurrencyAmountFormatter
                        symbol={symbol}
                        value={currentValue}
                        variant="headline-sm"
                        isDiscreetText={false}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        maximumFractionDigits={tokenContract ? 8 : 2}
                    />
                </Box>
            </Box>
            <PriceChangeIndicator valuePercentageChange={valuePercentageChange} />
        </Card>
    );
};
