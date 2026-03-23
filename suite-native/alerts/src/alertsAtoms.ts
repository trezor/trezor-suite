import { type ReactNode } from 'react';

import { atom } from 'jotai';

import {
    type ButtonAccessory,
    type ButtonColorScheme,
    type PictogramVariant,
} from '@suite-native/atoms';
import { type IconName } from '@suite-native/icons';
import { type NativeSpacing } from '@trezor/theme';

export type AlertType =
    | 'autoEject'
    | 'bluetoothAdapter'
    | 'bluetoothPairing'
    | 'connectDevice'
    | 'deviceError';

export type Alert = {
    title?: ReactNode;
    type?: AlertType;
    textAlign?: 'left' | 'center';
    description?: ReactNode;
    icon?: IconName;
    pictogramVariant?: PictogramVariant;
    primaryButtonTitle: ReactNode;
    primaryButtonViewLeft?: ButtonAccessory;
    primaryButtonViewRight?: ButtonAccessory;
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
export const hideAlertAtom = atom(null, (get, set, type?: AlertType) => {
    const current = get(alertAtom);

    if (!current) return;

    const shouldHide = !type || current?.type === type;

    if (shouldHide) {
        set(alertAtom, null);
    }
});
