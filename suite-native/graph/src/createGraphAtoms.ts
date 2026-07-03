import { type Atom, type PrimitiveAtom, type WritableAtom, atom } from 'jotai';

import { type FiatGraphPoint, type GroupedBalanceMovementEvent } from '@suite-common/graph';

import { createGraphPointDerivedAtoms } from './graphPointAtoms';
import { percentageDiff } from './utils';

export type GraphAtoms<TGraphPoint extends FiatGraphPoint = FiatGraphPoint> = {
    /** Points of the graph line, written by the graph data source. */
    graphPointsAtom: PrimitiveAtom<TGraphPoint[]>;
    isLoadingAtom: PrimitiveAtom<boolean>;
    errorAtom: PrimitiveAtom<Error | null>;
    /** Transaction events displayed on the account detail graph line. */
    graphEventsAtom: PrimitiveAtom<GroupedBalanceMovementEvent[] | undefined>;
    /** Point of the graph line currently selected by the swipe gesture. */
    selectedPointAtom: PrimitiveAtom<TGraphPoint | null>;
    /** First point of the graph line with some value, used as the base of the percentage change. */
    referencePointAtom: PrimitiveAtom<TGraphPoint | null>;
    selectedPointFiatValueAtom: Atom<string>;
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
    const isLoadingAtom = atom(true);
    const errorAtom = atom<Error | null>(null);
    const graphEventsAtom = atom<GroupedBalanceMovementEvent[] | undefined>(undefined);
    const selectedPointAtom = atom<TGraphPoint | null>(null);

    // Reference is usually the first point, same as Revolut does in their app.
    const referencePointAtom = atom<TGraphPoint | null>(null);

    const { selectedPointFiatValueAtom, selectedPointTimestampAtom } =
        createGraphPointDerivedAtoms(selectedPointAtom);

    const percentageChangeAtom = atom(get => {
        const selectedPoint = get(selectedPointAtom);
        const referencePoint = get(referencePointAtom);

        if (!referencePoint || !selectedPoint) return 0;

        return percentageDiff(referencePoint.value, selectedPoint.value);
    });

    const resetGraphAtom = atom(null, (_get, set) => {
        set(graphPointsAtom, []);
        set(isLoadingAtom, true);
        set(errorAtom, null);
        set(graphEventsAtom, undefined);
        set(selectedPointAtom, null);
        set(referencePointAtom, null);
    });

    return {
        graphPointsAtom,
        isLoadingAtom,
        errorAtom,
        graphEventsAtom,
        selectedPointAtom,
        referencePointAtom,
        selectedPointFiatValueAtom,
        selectedPointTimestampAtom,
        percentageChangeAtom,
        resetGraphAtom,
    };
};
