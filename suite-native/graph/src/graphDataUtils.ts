import {
    type FiatGraphPoint,
    type FiatGraphPointWithCryptoBalance,
    type GroupedBalanceMovementEvent,
} from '@suite-common/graph';
import { returnStableArrayIfEmpty } from '@suite-common/redux-utils';

import { type StoredFiatGraphPoint, type StoredGroupedBalanceMovementEvent } from './types';

export const serializeGraphPoints = (
    points: FiatGraphPoint[] | FiatGraphPointWithCryptoBalance[],
): StoredFiatGraphPoint[] =>
    points.map(point => ({
        ...point,
        date: point.date.getTime(),
    }));

export const serializeGraphEvents = (
    events: GroupedBalanceMovementEvent[] | undefined,
): StoredGroupedBalanceMovementEvent[] | undefined =>
    events?.map(event => ({
        ...event,
        date: event.date.getTime(),
    }));

export const deserializeGraphPoints = <TGraphPoint extends FiatGraphPoint = FiatGraphPoint>(
    points: StoredFiatGraphPoint[] | undefined,
): TGraphPoint[] =>
    returnStableArrayIfEmpty(
        points?.map(point => ({
            ...point,
            date: new Date(point.date),
        })) as TGraphPoint[] | undefined,
    );

export const deserializeGraphEvents = (
    events: StoredGroupedBalanceMovementEvent[] | undefined,
): GroupedBalanceMovementEvent[] =>
    returnStableArrayIfEmpty(
        events?.map(event => ({
            ...event,
            date: new Date(event.date),
        })),
    );
