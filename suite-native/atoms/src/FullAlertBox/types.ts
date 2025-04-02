import { Color } from '@trezor/theme';

import { BoxProps } from '../Box';
import { ButtonColorScheme, ButtonProps } from '../Button/Button';
export type AlertVariant = 'info' | 'critical' | 'neutral' | 'success' | 'warning';

export type FullAlertProps = {
    variant: AlertVariant;
    title: string;
    description?: string;
    primaryButtonLabel?: string;
    secondaryButtonLabel?: string;
    onPressPrimaryButton?: () => void;
    onPressSecondaryButton?: () => void;
    primaryButtonProps?: Partial<ButtonProps>;
    secondaryButtonProps?: Partial<ButtonProps>;
} & BoxProps;

export type FullAlertStyles = {
    backgroundColor: Color;
    borderColor: Color;
    primaryButtonColorScheme: ButtonColorScheme;
    secondaryButtonColorScheme: ButtonColorScheme;
};
