import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';
import { useSetAtom } from 'jotai';

import { useGraphForSingleAccount, Graph, TimeSwitch } from '@suite-native/graph';
import { VStack } from '@suite-native/atoms';
import { selectFiatCurrency } from '@suite-native/settings';
import { FiatGraphPointWithCryptoBalance } from '@suite-common/graph';

import {
    AccountDetailGraphHeader,
    referencePointAtom,
    selectedPointAtom,
} from './AccountDetailGraphHeader';

type AccountDetailGraphProps = {
    accountKey: string;
};

export const AccountDetailGraph = ({ accountKey }: AccountDetailGraphProps) => {
    const fiatCurrency = useSelector(selectFiatCurrency);
    const { graphPoints, graphEvents, error, isLoading, refetch, onSelectTimeFrame, timeframe } =
        useGraphForSingleAccount({
            accountKey,
            fiatCurrency: fiatCurrency.label,
        });

    const setSelectedPoint = useSetAtom(selectedPointAtom);
    const setReferencePoint = useSetAtom(referencePointAtom);
    const lastPoint = A.last(graphPoints);
    const firstPoint = A.head(graphPoints);

    const setInitialSelectedPoints = useCallback(() => {
        if (lastPoint && firstPoint) {
            setSelectedPoint(lastPoint);
            setReferencePoint(firstPoint);
        }
    }, [lastPoint, firstPoint, setSelectedPoint, setReferencePoint]);

    useEffect(setInitialSelectedPoints, [setInitialSelectedPoints]);

    return (
        <VStack spacing="large">
            <AccountDetailGraphHeader accountKey={accountKey} />
            <Graph<FiatGraphPointWithCryptoBalance>
                onPointSelected={setSelectedPoint}
                onGestureEnd={setInitialSelectedPoints}
                points={graphPoints}
                loading={isLoading}
                error={error}
                onTryAgain={refetch}
                events={graphEvents}
            />
            <TimeSwitch selectedTimeFrame={timeframe} onSelectTimeFrame={onSelectTimeFrame} />
        </VStack>
    );
};
