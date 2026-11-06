import { useState } from 'react';

import { useSetAtom } from 'jotai';

import { Translation } from '@suite-native/intl';
import { type GraphPoint, LineGraph } from '@suite-native/react-native-graph';
import { useNativeStyles } from '@trezor/styles-native';

import { GraphExtremesProvider } from './GraphExtremesContext';
import { HighExtremeLabel } from './HighExtremeLabel';
import { LowExtremeLabel } from './LowExtremeLabel';
import { PriceChartNote } from './PriceChartNote';
import { PriceSelectionTooltip } from './PriceSelectionTooltip';
import { SelectionDotWithLine } from './SelectionDotWithLine';
import { priceChartGraphStyle } from './priceChartGraphStyle';
import { selectedPricePointAtom } from './selectedPricePointAtom';

type PriceChartBodyProps = {
    points: GraphPoint[];
    isLoading: boolean;
    isError: boolean;
    isEmpty: boolean;
};

const PAN_GESTURE_DELAY = 16;

export const PriceChartBody = ({ points, isLoading, isError, isEmpty }: PriceChartBodyProps) => {
    const {
        applyStyle,
        utils: { colors, spacings },
    } = useNativeStyles();
    const [isScrubbing, setIsScrubbing] = useState(false);
    const setSelectedPricePoint = useSetAtom(selectedPricePointAtom);

    const handleGestureStart = () => setIsScrubbing(true);
    const handleGestureEnd = () => {
        setIsScrubbing(false);
        setSelectedPricePoint(null);
    };

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
        <GraphExtremesProvider points={points} isHidden={isScrubbing}>
            <LineGraph
                animated
                BottomAxisLabel={LowExtremeLabel}
                color={colors.borderBrand}
                enablePanGesture
                lineThickness={2}
                loading={isLoading}
                loadingLineColor={colors.borderNeutral}
                onGestureEnd={handleGestureEnd}
                onGestureStart={handleGestureStart}
                onPointSelected={setSelectedPricePoint}
                panGestureDelay={PAN_GESTURE_DELAY}
                points={points}
                SelectionDot={SelectionDotWithLine}
                SelectionTooltip={PriceSelectionTooltip}
                style={applyStyle(priceChartGraphStyle)}
                TopAxisLabel={HighExtremeLabel}
                verticalPadding={spacings.sp8}
            />
        </GraphExtremesProvider>
    );
};
