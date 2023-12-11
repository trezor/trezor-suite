import { useMemo } from 'react';

import { N } from '@mobily/ts-belt';
import * as Haptics from 'expo-haptics';

import { GraphPoint, LineGraph } from '@suite-native/react-native-graph';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Loader } from '@suite-native/atoms';
import {
    FiatGraphPoint,
    FiatGraphPointWithCryptoBalance,
    GroupedBalanceMovementEvent,
    GroupedBalanceMovementEventPayload,
} from '@suite-common/graph';
import { useTranslate } from '@suite-native/intl';

import { getExtremaFromGraphPoints } from '../utils';
import { AxisLabel, MAX_CLAMP_VALUE } from './AxisLabel';
import { GraphError } from './GraphError';
import { TransactionEventTooltip } from './TransactionEventTooltip';
import { SelectionDotWithLine } from './SelectionDotWithLine';
import { TransactionEvent } from './TransactionEvent';

type GraphProps<TGraphPoint extends GraphPoint> = {
    points: TGraphPoint[];
    loading?: boolean;
    onPointSelected?: (point: TGraphPoint) => void;
    onGestureEnd?: () => void;
    animated?: boolean;
    error?: string | null;
    onTryAgain: () => void;
    events?: GroupedBalanceMovementEvent[];
    loadingTakesLongerThanExpected?: boolean;
};

const GRAPH_HEIGHT = 250;

export const graphWrapperStyle = prepareNativeStyle(_ => ({
    justifyContent: 'center',
    height: GRAPH_HEIGHT,
    alignItems: 'center',
}));

export const graphMessageStyleContainer = prepareNativeStyle(_ => ({
    position: 'absolute',
    width: '100%',
    height: '90%',
    justifyContent: 'center',
    alignItems: 'center',
}));

type GraphStyleProps = {
    loading: boolean;
    error?: string | null;
};
const graphStyle = prepareNativeStyle<GraphStyleProps>((_, { loading, error }) => ({
    alignSelf: 'center',
    height: GRAPH_HEIGHT,
    width: '100%',
    opacity: loading || !!error ? 0.1 : 1,
}));

export const emptyGraphPoint: FiatGraphPointWithCryptoBalance = {
    value: 0,
    date: new Date(0),
    cryptoBalance: '0',
};

const emptyPoints: FiatGraphPointWithCryptoBalance[] = [
    { ...emptyGraphPoint },
    { ...emptyGraphPoint, date: new Date(1) },
];

// to avoid overflows from the screen
const clampAxisLabels = (value: number) => N.clamp(value, 5, MAX_CLAMP_VALUE);
const triggerHaptics = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export const Graph = <TGraphPoint extends FiatGraphPoint>({
    onPointSelected,
    onGestureEnd,
    onTryAgain,
    error,
    events,
    points = [],
    loading = false,
    animated = true,
    loadingTakesLongerThanExpected = false,
}: GraphProps<TGraphPoint>) => {
    const {
        applyStyle,
        utils: { colors },
    } = useNativeStyles();
    const { translate } = useTranslate();

    const isPointsEmpty = points.length <= 1;
    const nonEmptyPoints = isPointsEmpty ? emptyPoints : points;
    const extremaFromGraphPoints = useMemo(() => getExtremaFromGraphPoints(points), [points]);
    const axisLabels = useMemo(() => {
        if (extremaFromGraphPoints?.max && extremaFromGraphPoints?.min) {
            return {
                TopAxisLabel: () => (
                    <AxisLabel
                        x={clampAxisLabels(extremaFromGraphPoints.max.x)}
                        value={extremaFromGraphPoints.max.value}
                    />
                ),
                BottomAxisLabel: () => (
                    <AxisLabel
                        x={clampAxisLabels(extremaFromGraphPoints.min.x)}
                        value={extremaFromGraphPoints.min.value}
                    />
                ),
            };
        }
    }, [extremaFromGraphPoints]);

    // For some reason, 16 feels better than 0
    const panGestureDelay = 16;

    return (
        <Box style={applyStyle(graphWrapperStyle)}>
            <LineGraph<GroupedBalanceMovementEventPayload>
                style={applyStyle(graphStyle, { loading, error })}
                points={nonEmptyPoints}
                color={colors.borderSecondary}
                animated={animated}
                verticalPadding={20}
                enablePanGesture
                SelectionDot={SelectionDotWithLine}
                TopAxisLabel={axisLabels?.TopAxisLabel}
                BottomAxisLabel={axisLabels?.BottomAxisLabel}
                onPointSelected={onPointSelected as any /* because of ExtendedGraphPoint */}
                onGestureEnd={onGestureEnd}
                panGestureDelay={panGestureDelay}
                events={events}
                EventComponent={TransactionEvent}
                EventTooltipComponent={TransactionEventTooltip}
                onEventHover={triggerHaptics}
            />
            {loading && (
                <Box style={applyStyle(graphMessageStyleContainer)}>
                    <Loader
                        title={translate(
                            loadingTakesLongerThanExpected
                                ? 'graph.retrievengTakesLongerThanExpected'
                                : 'graph.retrievingData',
                        )}
                    />
                </Box>
            )}
            {error && !loading && (
                <Box style={applyStyle(graphMessageStyleContainer)}>
                    <GraphError error={error} onTryAgain={onTryAgain} />
                </Box>
            )}
        </Box>
    );
};
