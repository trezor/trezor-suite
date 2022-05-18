import React from 'react';
import { Text as RNText, View } from 'react-native';
import { useNativeStyles, prepareNativeStyle } from '@trezor/styles';
import { Icon } from './Icon/Icon';
import { IconType } from './Icon/iconTypes';
import { Color, colorVariants } from '@trezor/theme';
import * as CSS from 'csstype';

type HintType = 'hint' | 'error';

type HintProps = {
    type: HintType;
    children?: React.ReactNode;
};

const hintStyle = prepareNativeStyle(() => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
}));

const hintTypeStyle = prepareNativeStyle<{ color: CSS.Property.Color }>((utils, { color }) => ({
    ...utils.typography.label,
    color,
    marginLeft: 6,
}));

export const Hint = ({ type, children }: HintProps) => {
    const { applyStyle } = useNativeStyles();

    const hintTypeProps: Record<
        HintType,
        { iconType: IconType; color: CSS.Property.Color; colorVariant: Color }
    > = {
        hint: {
            colorVariant: 'gray600',
            color: colorVariants.standard.gray600,
            iconType: 'question',
        },
        error: {
            colorVariant: 'red',
            color: colorVariants.standard.red,
            iconType: 'warningCircle',
        },
    };

    return (
        <>
            <View style={[applyStyle(hintStyle)]}>
                <Icon
                    type={hintTypeProps[type].iconType}
                    color={hintTypeProps[type].colorVariant}
                    size="tiny"
                />
                <RNText style={[applyStyle(hintTypeStyle, { color: hintTypeProps[type].color })]}>
                    {children}
                </RNText>
            </View>
        </>
    );
};
