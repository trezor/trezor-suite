import { View, ViewProps, ViewStyle } from 'react-native';

import { D, pipe } from '@mobily/ts-belt';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { NativeSpacing } from '@trezor/theme';

import { useDebugView, DebugView } from './DebugView';
import { TestProps } from './types';

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

export const Box = ({ style, ...props }: BoxProps) => {
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
            style={[applyStyle(boxStyle, { ...layoutStyles, ...spacingStyles }), style]}
            {...otherProps}
        />
    );
};
