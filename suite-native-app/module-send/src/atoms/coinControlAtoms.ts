import { atom } from 'jotai';

import { type SelectedUtxos } from '../types';

export const selectedUtxosAtom = atom<SelectedUtxos>({});
