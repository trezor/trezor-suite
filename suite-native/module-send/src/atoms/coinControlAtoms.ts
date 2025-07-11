import { atom } from 'jotai';

import { SelectedUtxos } from '../types';

export const selectedUtxosAtom = atom<SelectedUtxos>({});
