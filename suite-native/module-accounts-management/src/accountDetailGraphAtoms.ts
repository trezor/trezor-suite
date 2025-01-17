import { atom } from 'jotai';

import { FiatGraphPointWithCryptoBalance } from '@suite-common/graph';
import { percentageDiff } from '@suite-native/graph';

export const selectedPointAtom = atom<FiatGraphPointWithCryptoBalance | null>(null);

// reference is usually first point, same as Revolut does in their app
export const referencePointAtom = atom<FiatGraphPointWithCryptoBalance | null>(null);

export const percentageChangeAtom = atom(get => {
    const selectedPoint = get(selectedPointAtom);
    const referencePoint = get(referencePointAtom);
    if (!referencePoint || !selectedPoint) return 0;

    return percentageDiff(referencePoint.value, selectedPoint.value);
});

export const hasPriceIncreasedAtom = atom(get => {
    const percentageChange = get(percentageChangeAtom);

    return percentageChange >= 0;
});
