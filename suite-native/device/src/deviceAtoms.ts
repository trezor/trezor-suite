import { atom } from 'jotai';

export const wasDeviceDisconnectedByUserActionAtom = atom<boolean>(false);
export const isOnboardingDeviceDisconnectedAlertDisplayedAtom = atom<boolean>(false);
