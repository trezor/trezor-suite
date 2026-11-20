import { atom } from 'jotai';

import { type GraphPoint } from '@suite-native/react-native-graph';

export const selectedPricePointAtom = atom<GraphPoint | null>(null);
