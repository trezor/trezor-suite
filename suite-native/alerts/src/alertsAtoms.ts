import { ReactNode } from 'react';

import { atom } from 'jotai';
import { RequireAllOrNone } from 'type-fest';

import { IconName } from '@suite-common/icons';
import { ButtonColorScheme, PictogramVariant } from '@suite-native/atoms';

export type Alert = RequireAllOrNone<
    {
        title: ReactNode;
        description: string;
        icon: IconName;
        pictogramVariant: PictogramVariant;
        primaryButtonTitle: string;
        primaryButtonVariant?: ButtonColorScheme;
        onPressPrimaryButton?: () => void;
        secondaryButtonTitle?: string;
        onPressSecondaryButton?: () => void;
        appendix?: ReactNode;
    },
    'secondaryButtonTitle' | 'onPressSecondaryButton'
>;

export const alertAtom = atom<Alert | null>(null);

export const showAlertAtom = atom(null, (_, set, alert: Alert) => set(alertAtom, alert));
export const hideAlertAtom = atom(null, (_, set) => set(alertAtom, null));
