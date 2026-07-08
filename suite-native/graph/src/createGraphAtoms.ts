import { type Atom, type PrimitiveAtom, type WritableAtom, atom } from 'jotai';

import { type FiatGraphPoint, type GroupedBalanceMovementEvent } from '@suite-common/graph';

import { percentageDiff } from './utils';

export type GraphAtoms<TGraphPoint extends FiatGraphPoint = FiatGraphPoint> = {
    /** Points of the graph line, written by the graph data source. */
    graphPointsAtom: PrimitiveAtom<TGraphPoint[]>;
    /** Transaction events displayed on the account detail graph line. */
    graphEventsAtom: PrimitiveAtom<GroupedBalanceMovementEvent[] | undefined>;
    /** Point of the graph line selected by the swipe gesture. Null while there is no gesture. */
    selectedPointAtom: PrimitiveAtom<TGraphPoint | null>;
    isGestureActiveAtom: Atom<boolean>;
    /** First point of the graph line with some value, used as the base of the percentage change. */
    referencePointAtom: Atom<TGraphPoint | null>;
    /** Fiat value of the point selected by the swipe gesture. */
    selectedPointFiatValueAtom: Atom<string>;
    /** Date of the selected point, or of the last point while there is no gesture. */
    selectedPointTimestampAtom: Atom<number | null>;
    percentageChangeAtom: Atom<number>;
    /** Write-only atom resetting all the base atoms back to their initial values. */
    resetGraphAtom: WritableAtom<null, [], void>;
};

/**
 * Creates a bundle of atoms holding the state of one graph instance.
 *
 * Use the atomic jotai structure for absolute minimum re-renders and maximum performance,
 * otherwise the graph would be freezing on slower devices while the point swipe gesture is active.
 * Each graph (portfolio, account detail) instantiates one module-level bundle, so its components
 * can subscribe to exactly the piece of state they display instead of receiving drilled props.
 */
export const createGraphAtoms = <
    TGraphPoint extends FiatGraphPoint = FiatGraphPoint,
>(): GraphAtoms<TGraphPoint> => {
    const graphPointsAtom = atom<TGraphPoint[]>([]);
    const graphEventsAtom = atom<GroupedBalanceMovementEvent[] | undefined>(undefined);
    const selectedPointAtom = atom<TGraphPoint | null>(null);

    const isGestureActiveAtom = atom(get => get(selectedPointAtom) !== null);

    const lastPointAtom = atom(get => {
        const graphPoints = get(graphPointsAtom);

        return graphPoints[graphPoints.length - 1] ?? null;
    });

    // Reference is usually the first point, same as Revolut does in their app.
    const referencePointAtom = atom(get => {
        const graphPoints = get(graphPointsAtom);

        return graphPoints.find(point => point.value > 0) ?? graphPoints[0] ?? null;
    });

    const selectedPointFiatValueAtom = atom(get => String(get(selectedPointAtom)?.value ?? 0));

    const selectedPointTimestampAtom = atom(get => {
        const displayedPoint = get(selectedPointAtom) ?? get(lastPointAtom);

        return displayedPoint?.date.getTime() ?? null;
    });

    // While there is no gesture, the change of the last point against the reference is displayed.
    const percentageChangeAtom = atom(get => {
        const referencePoint = get(referencePointAtom);
        const comparedPoint = get(selectedPointAtom) ?? get(lastPointAtom);

        if (!referencePoint || !comparedPoint) return 0;

        return percentageDiff(referencePoint.value, comparedPoint.value);
    });

    const resetGraphAtom = atom(null, (_get, set) => {
        set(graphPointsAtom, []);
        set(graphEventsAtom, undefined);
        set(selectedPointAtom, null);
    });

    return {
        graphPointsAtom,
        graphEventsAtom,
        selectedPointAtom,
        isGestureActiveAtom,
        referencePointAtom,
        selectedPointFiatValueAtom,
        selectedPointTimestampAtom,
        percentageChangeAtom,
        resetGraphAtom,
    };
};
