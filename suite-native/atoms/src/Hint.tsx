import { ReactNode } from 'react';
import { View } from 'react-native';

import { Icon, IconName } from '@suite-common/icons';
import { useNativeStyles, prepareNativeStyle, NativeStyleObject } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { Text } from './Text';

type HintVariant = 'hint' | 'error';

type HintProps = {
    variant?: HintVariant;
    style?: NativeStyleObject;
    children?: ReactNode;
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
        color: 'textSubdued',
        iconName: 'question',
    },
    error: {
        color: 'textAlertRed',
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
                size="s"
            />
            <Text style={applyStyle(hintTextStyle, { color: hintVariants[variant].color })}>
                {children}
            </Text>
        </View>
    );
};
