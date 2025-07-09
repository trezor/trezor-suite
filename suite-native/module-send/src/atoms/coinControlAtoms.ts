import { atom } from 'jotai';

import { Utxo } from '@trezor/blockchain-link-types';

export const selectedUtxosAtom = atom<Utxo[]>([]);
