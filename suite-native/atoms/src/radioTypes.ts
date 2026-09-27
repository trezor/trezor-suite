import { type PressableProps } from 'react-native';

import { type NativeStyleObject } from '@trezor/styles-native';

export type RadioIndicatorProps = {
    isChecked?: boolean;
    isDisabled?: boolean;
    style?: NativeStyleObject;
    testID?: string;
};

export type RadioProps<TValue> = Omit<PressableProps, 'style' | 'onPress'> &
    RadioIndicatorProps & {
        value: TValue;
        onPress: (value: TValue) => void;
    };
