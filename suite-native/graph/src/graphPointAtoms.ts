import { type Atom, atom } from 'jotai';

import { type FiatGraphPoint } from '@suite-common/graph';

export const createGraphPointDerivedAtoms = <TGraphPoint extends FiatGraphPoint>(
    selectedPointAtom: Atom<TGraphPoint | null>,
) => ({
    selectedPointFiatValueAtom: atom(get => {
        const selectedPoint = get(selectedPointAtom);

        return selectedPoint?.valueLatestTotal?.toFixed() ?? String(selectedPoint?.value ?? 0);
    }),
    selectedPointTimestampAtom: atom(get => get(selectedPointAtom)?.date.getTime() ?? null),
});
