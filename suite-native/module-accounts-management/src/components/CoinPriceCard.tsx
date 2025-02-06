import { useSelector } from 'react-redux';

import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { Box, Card, PriceChangeBadge, Text } from '@suite-native/atoms';
import { FiatAmountFormatter } from '@suite-native/formatters';
import { CryptoIconWithNetwork } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { useDayCoinPriceChange } from '../hooks/useDayCoinPriceChange';

type CoinPriceCardProps = {
    accountKey: AccountKey;
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
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
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
    marginTop: utils.spacings.sp2,
}));

const PriceChangeIndicator = ({ valuePercentageChange }: PriceChangeIndicatorProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(indicatorContainer)}>
            <Text variant="label" color="textSubdued">
                <Translation id="moduleAccountManagement.accountDetailContentScreen.coinPriceCard.changeIn24h" />
            </Text>
            <PriceChangeBadge valuePercentageChange={valuePercentageChange} />
        </Box>
    );
};

export const CoinPriceCard = ({ accountKey }: CoinPriceCardProps) => {
    const { applyStyle } = useNativeStyles();

    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const { currentValue, valuePercentageChange } = useDayCoinPriceChange(symbol);

    if (!symbol) return null;

    const coinName = getNetworkDisplaySymbolName(symbol);

    return (
        <Card style={applyStyle(cardStyle)}>
            <Box flexDirection="row" alignItems="center" flex={1}>
                <Box marginRight="sp16">
                    <CryptoIconWithNetwork symbol={symbol} />
                </Box>
                <Box style={applyStyle(cardContentStyle)}>
                    <Text variant="label" color="textSubdued">
                        <Translation
                            id="moduleAccountManagement.accountDetailContentScreen.coinPriceCard.coinPrice"
                            values={{ coinName }}
                        />
                    </Text>
                    {currentValue && (
                        <FiatAmountFormatter
                            symbol={symbol}
                            value={`${currentValue}`}
                            variant="titleSmall"
                            isDiscreetText={false}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        />
                    )}
                </Box>
            </Box>

            <PriceChangeIndicator valuePercentageChange={valuePercentageChange} />
        </Card>
    );
};
