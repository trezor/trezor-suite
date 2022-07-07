import { D, pipe } from '@mobily/ts-belt';
import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Spacing } from '@trezor/theme';

const layoutStylePropsKeys = [
    'flex',
    'flexDirection',
    'justifyContent',
    'alignItems',
    'alignContent',
    'alignSelf',
    'flexWrap',
] as const;

const spacingStylePropsKeys = [
    'marginHorizontal',
    'marginVertical',
    'marginTop',
    'marginRight',
    'marginBottom',
    'marginLeft',
    'margin',

    'paddingHorizontal',
    'paddingVertical',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'padding',
] as const;

type SpacingStyleProps = Partial<Record<typeof spacingStylePropsKeys[number], Spacing>>;
type LayoutStyleProps = Partial<Pick<ViewStyle, typeof layoutStylePropsKeys[number]>>;

export interface BoxProps extends Omit<ViewProps, 'style'>, LayoutStyleProps, SpacingStyleProps {
    style?: NativeStyleObject;
}

type BoxStyleProps = Record<typeof spacingStylePropsKeys[number], number> & LayoutStyleProps;

const boxStyle = prepareNativeStyle<BoxStyleProps>((_utils, { ...styles }) => ({
    ...styles,
}));

export const Box = ({ style, ...props }: BoxProps) => {
    const { applyStyle, utils } = useNativeStyles();

    const layoutStyles = D.selectKeys(props, [...layoutStylePropsKeys]);
    const spacingStyles = pipe(
        props,
        D.selectKeys([...spacingStylePropsKeys]),
        D.map(spacing => (spacing ? utils.spacings[spacing] : 0)),
    );
    const otherProps = D.deleteKeys(props, [...layoutStylePropsKeys, ...spacingStylePropsKeys]);

    return (
        <View
            style={[applyStyle(boxStyle, { ...layoutStyles, ...spacingStyles }), style]}
            {...otherProps}
        />
    );
};
