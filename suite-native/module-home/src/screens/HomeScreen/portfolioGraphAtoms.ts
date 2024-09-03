import { atom } from 'jotai';

import { FiatGraphPoint, FiatGraphPointWithCryptoBalance } from '@suite-common/graph';
import { percentageDiff } from '@suite-native/graph';

const emptyGraphPoint: FiatGraphPointWithCryptoBalance = {
    value: 0,
    date: new Date(0),
    cryptoBalance: '0',
};

// use atomic jotai structure for absolute minimum re-renders and maximum performance
// otherwise graph will be freezing on slower device while point swipe gesture
export const selectedPointAtom = atom<FiatGraphPoint>(emptyGraphPoint);

// reference is usually first point, same as Revolut does in their app
export const referencePointAtom = atom<FiatGraphPoint | null>(null);

export const percentageChangeAtom = atom(get => {
    const selectedPoint = get(selectedPointAtom);
    const referencePoint = get(referencePointAtom);

    if (!referencePoint) return 0;

    return percentageDiff(referencePoint.value, selectedPoint.value);
});

export const hasPriceIncreasedAtom = atom(get => {
    const percentageChange = get(percentageChangeAtom);

    return percentageChange >= 0;
});
