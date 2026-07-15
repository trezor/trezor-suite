import { atom } from 'jotai';

import { type FiatGraphPointWithCryptoBalance } from '@suite-common/graph';
import { createGraphPointDerivedAtoms, percentageDiff } from '@suite-native/graph';

export const selectedPointAtom = atom<FiatGraphPointWithCryptoBalance | null>(null);

export const { selectedPointFiatValueAtom, selectedPointTimestampAtom } =
    createGraphPointDerivedAtoms(selectedPointAtom);

// reference is usually first point, same as Revolut does in their app
export const referencePointAtom = atom<FiatGraphPointWithCryptoBalance | null>(null);

export const percentageChangeAtom = atom(get => {
    const selectedPoint = get(selectedPointAtom);
    const referencePoint = get(referencePointAtom);
    if (!referencePoint || !selectedPoint) return 0;

    return percentageDiff(referencePoint.value, selectedPoint.value);
});
