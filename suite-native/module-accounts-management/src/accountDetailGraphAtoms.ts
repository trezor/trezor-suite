import { atom } from 'jotai';

import { FiatGraphPointWithCryptoBalance } from '@suite-common/graph/libDev/src';
import { percentageDiff } from '@suite-native/graph';

export const emptyGraphPoint: FiatGraphPointWithCryptoBalance = {
    value: 0,
    date: new Date(0),
    cryptoBalance: '0',
};

export const selectedPointAtom = atom<FiatGraphPointWithCryptoBalance>(emptyGraphPoint);

// reference is usually first point, same as Revolut does in their app
export const referencePointAtom = atom<FiatGraphPointWithCryptoBalance | null>(null);

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
