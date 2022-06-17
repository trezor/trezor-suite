import React from 'react';
import { View } from 'react-native';
import { useNativeStyles, prepareNativeStyle, NativeStyleObject } from '@trezor/styles';
import { Color } from '@trezor/theme';
import { Icon, IconName } from '@trezor/icons';
import { Text } from './Text';

type HintVariant = 'hint' | 'error';

type HintProps = {
    variant?: HintVariant;
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

const hintVariants: Record<HintVariant, { iconName: IconName; color: Color }> = {
    hint: {
        color: 'gray600',
        iconName: 'question',
    },
    error: {
        color: 'red',
        iconName: 'warningCircle',
    },
};

export const Hint = ({ style, children, variant = 'hint' }: HintProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <View style={[applyStyle(hintStyle), style]}>
            <Icon
                name={hintVariants[variant].iconName}
                color={hintVariants[variant].color}
                size="small"
            />
            <Text style={applyStyle(hintTextStyle, { color: hintVariants[variant].color })}>
                {children}
            </Text>
        </View>
    );
};
