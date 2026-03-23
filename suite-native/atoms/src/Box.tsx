import React from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';

import { D, pipe } from '@mobily/ts-belt';

import { type NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { type NativeSpacing } from '@trezor/theme';

import { DebugView, useDebugView } from './DebugView';
import { type TestProps } from './types';

const layoutStylePropsKeys = [
    'flex',
    'flexDirection',
    'justifyContent',
    'alignItems',
    'alignContent',
    'alignSelf',
    'flexWrap',
    'flexShrink',
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

type SpacingStyleProps = Partial<Record<(typeof spacingStylePropsKeys)[number], NativeSpacing>>;
type LayoutStyleProps = Partial<Pick<ViewStyle, (typeof layoutStylePropsKeys)[number]>>;

type Style = NativeStyleObject | Array<Style | undefined>;

export interface BoxProps extends ViewProps, LayoutStyleProps, SpacingStyleProps, TestProps {
    style?: Style;
}

type BoxStyleProps = Record<(typeof spacingStylePropsKeys)[number], number> & LayoutStyleProps;

const boxStyle = prepareNativeStyle<BoxStyleProps>((_utils, { ...styles }) => ({
    ...styles,
}));

export const Box = React.forwardRef<View, BoxProps>(({ style, ...props }, ref) => {
    const { applyStyle, utils } = useNativeStyles();
    const { isFlashOnRerenderEnabled } = useDebugView();
    const ViewComponent = isFlashOnRerenderEnabled ? DebugView : View;

    const layoutStyles = D.selectKeys(props, [...layoutStylePropsKeys]);
    const spacingStyles = pipe(
        props,
        D.selectKeys([...spacingStylePropsKeys]),
        D.map(spacing => (spacing ? utils.spacings[spacing] : 0)),
    );
    const otherProps = D.deleteKeys(props, [...layoutStylePropsKeys, ...spacingStylePropsKeys]);

    return (
        <ViewComponent
            {...otherProps}
            style={[applyStyle(boxStyle, { ...layoutStyles, ...spacingStyles }), style]}
            ref={ref}
        />
    );
});

Box.displayName = 'Box';
