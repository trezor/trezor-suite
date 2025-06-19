import { atom } from 'jotai';

import { Utxo } from '@trezor/blockchain-link-types';

export const coinControlEnabledAtom = atom<boolean>(false);
export const selectedUtxosAtom = atom<Utxo[]>([]);
