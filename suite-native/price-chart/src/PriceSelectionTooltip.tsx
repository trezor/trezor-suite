import { useWindowDimensions } from 'react-native';
import { useAnimatedStyle } from 'react-native-reanimated';

import { useAtomValue } from 'jotai';

import { useFormatters } from '@suite-common/formatters';
import { AssetPriceChartRange } from '@suite-common/price-chart';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Text } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { type SelectionTooltipProps } from '@suite-native/react-native-graph';
import { BigNumber } from '@trezor/utils';

import { GraphTooltip, getGraphTooltipPosition } from './GraphTooltip';
import { assetPriceChartRangeAtom } from './assetPriceChartRangeAtom';
import { selectedPricePointAtom } from './selectedPricePointAtom';

const rangesWithTime = [AssetPriceChartRange.Day, AssetPriceChartRange.Week];

export const PriceSelectionTooltip = ({ circleX, circleY }: SelectionTooltipProps) => {
    const selectedPoint = useAtomValue(selectedPricePointAtom);
    const range = useAtomValue(assetPriceChartRangeAtom);
    const { DateFormatter, DateTimeFormatter } = useFormatters();
    const { width: windowWidth } = useWindowDimensions();

    const positionStyle = useAnimatedStyle(() =>
        getGraphTooltipPosition(circleX.value, circleY.value, windowWidth),
    );

    if (selectedPoint === null) {
        return null;
    }

    const DateValueFormatter = rangesWithTime.includes(range) ? DateTimeFormatter : DateFormatter;

    return (
        <GraphTooltip positionStyle={positionStyle}>
            <BaseCurrencyAmountFormatter
                value={asBaseCurrencyAmount(new BigNumber(selectedPoint.value))}
                variant="body-xs"
                color="contentPrimary"
                discreetMode="disabled"
            />
            <Text variant="body-xs" color="contentSecondary">
                <DateValueFormatter value={selectedPoint.date} />
            </Text>
        </GraphTooltip>
    );
};
