import { type Atom, type PrimitiveAtom, atom } from 'jotai';

import { type FiatGraphPoint } from '@suite-common/graph';

export type GraphAtoms<TGraphPoint extends FiatGraphPoint = FiatGraphPoint> = {
    /** Point of the graph line selected by the swipe gesture. Null while there is no gesture. */
    selectedPointAtom: PrimitiveAtom<TGraphPoint | null>;
    isGestureActiveAtom: Atom<boolean>;
};

/**
 * Creates a bundle of atoms holding gesture state of one graph instance.
 *
 * Use the atomic jotai structure for absolute minimum re-renders and maximum performance,
 * otherwise the graph could freeze on slower devices while the point swipe gesture is active.
 * Each graph (portfolio, account detail) instantiates one module-level bundle, so its components
 * can subscribe to gesture state without receiving drilled props.
 */
export const createGraphAtoms = <
    TGraphPoint extends FiatGraphPoint = FiatGraphPoint,
>(): GraphAtoms<TGraphPoint> => {
    const selectedPointAtom = atom<TGraphPoint | null>(null);

    const isGestureActiveAtom = atom(get => get(selectedPointAtom) !== null);

    return {
        selectedPointAtom,
        isGestureActiveAtom,
    };
};
