import { Translation } from '@suite-native/intl';
import { type GraphPoint, LineGraph } from '@suite-native/react-native-graph';
import { useNativeStyles } from '@trezor/styles-native';

import { PriceChartNote } from './PriceChartNote';
import { priceChartGraphStyle } from './priceChartGraphStyle';

type PriceChartBodyProps = {
    points: GraphPoint[];
    isLoading: boolean;
    isError: boolean;
    isEmpty: boolean;
};

export const PriceChartBody = ({ points, isLoading, isError, isEmpty }: PriceChartBodyProps) => {
    const {
        applyStyle,
        utils: { colors },
    } = useNativeStyles();

    if (isError) {
        return (
            <PriceChartNote testID="@price-chart/error">
                <Translation id="graph.priceHistoryError" />
            </PriceChartNote>
        );
    }

    if (isEmpty) {
        return (
            <PriceChartNote testID="@price-chart/empty">
                <Translation id="graph.priceHistoryEmpty" />
            </PriceChartNote>
        );
    }

    return (
        <LineGraph
            animated
            color={colors.borderBrand}
            enablePanGesture={false}
            lineThickness={2}
            loading={isLoading}
            loadingLineColor={colors.borderNeutral}
            points={points}
            style={applyStyle(priceChartGraphStyle)}
        />
    );
};
