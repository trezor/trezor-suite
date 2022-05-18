import React from 'react';
import { View } from 'react-native';
import { useNativeStyles, prepareNativeStyle, NativeStyleObject } from '@trezor/styles';
import { Color } from '@trezor/theme';
import { Icon } from './Icon/Icon';
import { Text } from './Text';
import { IconType } from './Icon/iconTypes';

type HintVariant = 'hint' | 'error';

type HintProps = {
    variant: HintVariant;
    style?: NativeStyleObject;
    children?: React.ReactNode;
};

const hintStyle = prepareNativeStyle(() => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
}));

const hintTextStyle = prepareNativeStyle<{ color: Color }>((utils, { color }) => ({
    ...utils.typography.label,
    color: utils.colors[color],
    marginLeft: 6,
}));

const hintVariants: Record<HintVariant, { iconType: IconType; color: Color }> = {
    hint: {
        color: 'gray600',
        iconType: 'question',
    },
    error: {
        color: 'red',
        iconType: 'warningCircle',
    },
};

export const Hint = ({ variant, style, children }: HintProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <View style={[applyStyle(hintStyle), style]}>
            <Icon
                type={hintVariants[variant].iconType}
                color={hintVariants[variant].color}
                size="tiny"
            />
            <Text style={applyStyle(hintTextStyle, { color: hintVariants[variant].color })}>
                {children}
            </Text>
        </View>
    );
};
