import { PressableProps } from 'react-native';

import { NativeStyleObject } from '@trezor/styles';

export interface NumPadButtonProps extends Omit<PressableProps, 'style'> {
    title: string;
    onPress: () => void;
    variant?: NumPadButtonVariant;
    style?: NativeStyleObject;
}

export type NumPadButtonVariant = 'primary' | 'secondary' | 'default'; // TODO missing one variant still

export type NumPadButtonStyleProps = {
    variant: NumPadButtonVariant;
};
