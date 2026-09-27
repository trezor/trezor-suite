import { type ReactElement } from 'react';
import { type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { type ButtonColorProps, type ButtonSize } from './types';

export type NativeButtonProps = Omit<
    PressableProps,
    'children' | 'style' | 'onPress' | 'onPressIn' | 'onPressOut'
> &
    ButtonColorProps & {
        children: ReactElement;
        onPress?: () => void;
        size: ButtonSize;
        isDisabled: boolean;
        isLoading: boolean;
        isFullWidth: boolean;
        flex?: number;
        style?: StyleProp<ViewStyle>;
    };

export type NativeButtonContainerProps = Omit<
    NativeButtonProps,
    'intent' | 'priority' | 'isInverse'
> & { control: ReactElement };
