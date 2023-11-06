import { useSelector } from 'react-redux';

import { Box, Text, Card, RoundedIcon, Badge, Loader } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { networks } from '@suite-common/wallet-config';
import { FiatAmountFormatter } from '@suite-native/formatters';
import { AccountKey } from '@suite-common/wallet-types';
import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';

import { useDayCoinPriceChange } from '../hooks/useDayCoinPriceChange';

type CoinPriceCardProps = {
    accountKey: AccountKey;
};

type PriceChangeIndicatorProps = {
    valuePercentageChange: number;
};

const cardStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItem: 'center',
    padding: utils.spacings.medium,
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderRadius: utils.borders.radii.medium,
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
    marginTop: utils.spacings.s / 4,
}));

const PriceChangeIndicator = ({ valuePercentageChange }: PriceChangeIndicatorProps) => {
    const { applyStyle } = useNativeStyles();
    const priceHasIncreased = valuePercentageChange >= 0;

    const icon = priceHasIncreased ? 'arrowUp' : 'arrowDown';
    const badgeVariant = priceHasIncreased ? 'green' : 'red';
    const formattedPercentage = `${valuePercentageChange.toPrecision(3)} %`;

    return (
        <Box style={applyStyle(indicatorContainer)}>
            <Text variant="label" color="textSubdued">
                24h change
            </Text>
            <Box justifyContent="center" alignItems="center" flexDirection="row">
                <Badge
                    icon={icon}
                    iconSize="xs"
                    size="medium"
                    variant={badgeVariant}
                    label={formattedPercentage}
                />
            </Box>
        </Box>
    );
};

export const CoinPriceCard = ({ accountKey }: CoinPriceCardProps) => {
    const { applyStyle } = useNativeStyles();

    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const { currentValue, valuePercentageChange } = useDayCoinPriceChange(networkSymbol);

    if (!networkSymbol) return null;

    const coinName = networks[networkSymbol].name;

    return (
        <Card style={applyStyle(cardStyle)}>
            <Box flexDirection="row" alignItems="center" flex={1}>
                <Box marginRight="medium">
                    <RoundedIcon name={networkSymbol} />
                </Box>
                <Box style={applyStyle(cardContentStyle)}>
                    <Text variant="label" color="textSubdued">
                        {coinName} price
                    </Text>
                    {currentValue && (
                        <FiatAmountFormatter
                            network={networkSymbol}
                            value={`${currentValue}`}
                            variant="titleSmall"
                            isDiscreetText={false}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        />
                    )}
                </Box>
            </Box>
            {valuePercentageChange ? (
                <PriceChangeIndicator valuePercentageChange={valuePercentageChange} />
            ) : (
                <Box alignItems="center" justifyContent="center">
                    <Loader size="large" />
                </Box>
            )}
        </Card>
    );
};
