import { fromUnixTime } from 'date-fns';

import { FiatGraphPoint, FiatGraphPointWithCryptoBalance } from '@suite-common/graph-neue';

export type EnhancedGraphPoint = {
    date: Date;
    originalDate: Date;
    value: FiatGraphPoint['fiatBalance'];
};

export type EnhancedGraphPointWithCryptoBalance = {
    cryptoBalance: string;
} & EnhancedGraphPoint;

export const enhanceGraphPoints = (
    graphPoints: FiatGraphPoint[] | FiatGraphPointWithCryptoBalance[],
): EnhancedGraphPoint[] | EnhancedGraphPointWithCryptoBalance[] =>
    graphPoints.map((point, index) => ({
        value: point.fiatBalance,
        originalDate: fromUnixTime(point.timestamp),
        // @ts-expect-error this is safe, not sure why TS complains
        cryptoBalance: point?.cryptoBalance,
        date: new Date(index),
    }));
