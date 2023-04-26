import { atom } from 'jotai';
import { RequireAllOrNone } from 'type-fest';

import { IconName } from '@trezor/icons';
import { PictogramVariant } from '@suite-native/atoms';

export type Alert = RequireAllOrNone<
    {
        title: string;
        description: string;
        icon: IconName;
        pictogramVariant: PictogramVariant;
        primaryButtonTitle: string;
        onPressPrimaryButton: () => void;
        secondaryButtonTitle?: string;
        onPressSecondaryButton?: () => void;
    },
    'secondaryButtonTitle' | 'onPressSecondaryButton'
>;

export const alertAtom = atom<Alert | null>(null);

export const showAlertAtom = atom(null, (_, set, alert: Alert) => set(alertAtom, alert));
export const hideAlertAtom = atom(null, (_, set) => set(alertAtom, null));
