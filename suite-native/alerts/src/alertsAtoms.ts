import { ReactNode } from 'react';

import { atom } from 'jotai';

import { IconName } from '@suite-common/icons';
import { ButtonColorScheme, PictogramVariant } from '@suite-native/atoms';

export type Alert = {
    title: ReactNode;
    description: ReactNode;
    icon?: IconName;
    pictogramVariant?: PictogramVariant;
    primaryButtonTitle: ReactNode;
    primaryButtonVariant?: ButtonColorScheme;
    onPressPrimaryButton?: () => void;
    secondaryButtonTitle?: ReactNode;
    secondaryButtonVariant?: ButtonColorScheme;
    onPressSecondaryButton?: () => void;
    appendix?: ReactNode;
    testID?: string;
};

export const alertAtom = atom<Alert | null>(null);

export const showAlertAtom = atom(null, (_, set, alert: Alert) => set(alertAtom, alert));
export const hideAlertAtom = atom(null, (_, set) => set(alertAtom, null));
