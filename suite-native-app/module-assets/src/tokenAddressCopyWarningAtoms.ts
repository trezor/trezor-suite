import { atom } from 'jotai';

import { atomWithUnecryptedStorage } from '@suite-native/storage';

export const hasTokenCopyWarningBeenDisabledAtom = atomWithUnecryptedStorage<boolean>(
    'hasTokenAddressCopyWarningBeenDisabled',
    false,
);

export const isTokenCopyWarningOptOutCheckedAtom = atom(false);
