import { atom } from 'jotai';

import { FiatGraphPoint } from '@suite-common/graph';
import { percentageDiff } from '@suite-native/graph';

// use atomic jotai structure for absolute minimum re-renders and maximum performance
// otherwise graph will be freezing on slower device while point swipe gesture
export const selectedPointAtom = atom<FiatGraphPoint | null>(null);

// reference is usually first point, same as Revolut does in their app
export const referencePointAtom = atom<FiatGraphPoint | null>(null);

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
