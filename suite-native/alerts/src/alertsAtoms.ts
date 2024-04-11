import { ReactNode } from 'react';

import { atom } from 'jotai';
import { RequireAllOrNone } from 'type-fest';

import { IconName } from '@suite-common/icons';
import { ButtonColorScheme, PictogramVariant } from '@suite-native/atoms';

export type Alert = RequireAllOrNone<
    {
        title: ReactNode;
        description: ReactNode;
        icon?: IconName;
        pictogramVariant?: PictogramVariant;
        primaryButtonTitle: ReactNode;
        primaryButtonVariant?: ButtonColorScheme;
        onPressPrimaryButton?: () => void;
        secondaryButtonTitle?: ReactNode;
        onPressSecondaryButton?: () => void;
        appendix?: ReactNode;
    },
    'secondaryButtonTitle' | 'onPressSecondaryButton'
>;

export const alertAtom = atom<Alert | null>(null);

export const showAlertAtom = atom(null, (_, set, alert: Alert) => set(alertAtom, alert));
export const hideAlertAtom = atom(null, (_, set) => set(alertAtom, null));
