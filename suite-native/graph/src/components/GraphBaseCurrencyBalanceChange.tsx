import { type Atom, useAtomValue } from 'jotai';

import { type FiatGraphPoint } from '@suite-common/graph';
import { HStack } from '@suite-native/atoms';

import { percentageDiff } from '../utils';
import { GraphDateFormatter } from './GraphDateFormatter';
import { PriceChangeIndicator } from './PriceChangeIndicator';

type GraphBaseCurrencyBalanceChangeProps<TGraphPoint extends FiatGraphPoint> = {
    points: TGraphPoint[];
    firstGraphPoint: TGraphPoint;
    selectedPointAtom: Atom<TGraphPoint | null>;
};

export const GraphBaseCurrencyBalanceChange = <TGraphPoint extends FiatGraphPoint>({
    points,
    firstGraphPoint,
    selectedPointAtom,
}: GraphBaseCurrencyBalanceChangeProps<TGraphPoint>) => {
    const selectedPoint = useAtomValue(selectedPointAtom);
    const lastGraphPoint = points[points.length - 1] ?? null;
    const displayedPoint = selectedPoint ?? lastGraphPoint;
    const selectedPointTimestamp = displayedPoint?.date.getTime() ?? null;
    const percentageChange = displayedPoint
        ? percentageDiff(firstGraphPoint.value, displayedPoint.value)
        : 0;

    return (
        <HStack alignItems="center">
            <GraphDateFormatter
                firstPointDate={firstGraphPoint.date}
                selectedPointTimestamp={selectedPointTimestamp}
            />
            <PriceChangeIndicator percentageChange={percentageChange} />
        </HStack>
    );
};
