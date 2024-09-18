import { ReactNode } from 'react';

import { atom } from 'jotai';

import { IconName } from '@suite-common/icons-deprecated';
import { ButtonAccessory, ButtonColorScheme, PictogramVariant } from '@suite-native/atoms';
import { NativeSpacing } from '@trezor/theme';

export type Alert = {
    title?: ReactNode;
    textAlign?: 'left' | 'center';
    description?: ReactNode;
    icon?: IconName;
    pictogramVariant?: PictogramVariant;
    primaryButtonTitle: ReactNode;
    primaryButtonViewLeft?: ButtonAccessory;
    primaryButtonVariant?: ButtonColorScheme;
    onPressPrimaryButton?: () => void;
    secondaryButtonTitle?: ReactNode;
    secondaryButtonVariant?: ButtonColorScheme;
    onPressSecondaryButton?: () => void;
    appendix?: ReactNode;
    testID?: string;
    titleSpacing?: NativeSpacing;
};

export const alertAtom = atom<Alert | null>(null);

export const showAlertAtom = atom(null, (_, set, alert: Alert) => set(alertAtom, alert));
export const hideAlertAtom = atom(null, (_, set) => set(alertAtom, null));
