import React, { ReactNode } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { G } from '@mobily/ts-belt';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { InlineAlertBox, InlineAlertBoxProps } from '../InlineAlertBox/InlineAlertBox';

type AlertPosition = 'top' | 'bottom';

export type CardProps = {
    children: ReactNode;
    style?: NativeStyleObject;
    noPadding?: boolean;
    borderColor?: Color;
    alertProps?: InlineAlertBoxProps;
    alertPosition?: AlertPosition;
};

const cardOuterContainerStyle = prepareNativeStyle<{
    flex?: number;
}>((_, { flex }) => ({
    flex,
}));

const cardInnerContainerStyle = prepareNativeStyle<{
    alertPosition?: AlertPosition;
    noPadding: boolean;
    borderColor?: Color;
}>((utils, { alertPosition, noPadding, borderColor }) => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderRadius: utils.borders.radii.r16,
    padding: noPadding ? 0 : utils.spacings.sp16,
    ...utils.boxShadows.small,

    extend: [
        {
            condition: alertPosition === 'top',
            style: {
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
            },
        },
        {
            condition: alertPosition === 'bottom',
            style: {
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
            },
        },
        {
            condition: G.isNotNullable(borderColor),
            style: {
                borderColor: utils.colors[borderColor!],
                borderWidth: utils.borders.widths.small,
            },
        },
    ],
}));

const alertBoxWrapperStyle = prepareNativeStyle<{
    alertPosition?: AlertPosition;
}>((utils, { alertPosition = 'top' }) => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    paddingHorizontal: utils.spacings.sp4,
    extend: [
        {
            condition: alertPosition === 'top',
            style: {
                borderTopLeftRadius: utils.borders.radii.r16,
                borderTopRightRadius: utils.borders.radii.r16,
                paddingTop: utils.spacings.sp4,
            },
        },
        {
            condition: alertPosition === 'bottom',
            style: {
                borderBottomLeftRadius: utils.borders.radii.r16,
                borderBottomRightRadius: utils.borders.radii.r16,
                paddingBottom: utils.spacings.sp4,
            },
        },
    ],
}));

export const Card = React.forwardRef<View, CardProps>(
    (
        { children, style, alertProps, alertPosition, borderColor, noPadding = false }: CardProps,
        ref,
    ) => {
        const { applyStyle } = useNativeStyles();

        return (
            <View style={applyStyle(cardOuterContainerStyle, { flex: style?.flex })}>
                {!!alertProps && alertPosition !== 'bottom' && (
                    <View style={applyStyle(alertBoxWrapperStyle, { alertPosition })}>
                        <InlineAlertBox {...alertProps} />
                    </View>
                )}
                <View
                    style={[
                        /* CAUTION: in case that alert is displayed, it is not possible to change styles of the borders by the `style` prop. */
                        applyStyle(cardInnerContainerStyle, {
                            alertPosition,
                            noPadding,
                            borderColor,
                        }),
                        style,
                    ]}
                    // Ref must be here otherwise the animation will not work
                    ref={ref}
                >
                    {children}
                </View>
                {!!alertProps && alertPosition === 'bottom' && (
                    <View style={applyStyle(alertBoxWrapperStyle, { alertPosition })}>
                        <InlineAlertBox {...alertProps} />
                    </View>
                )}
            </View>
        );
    },
);

Card.displayName = 'Card';
export const AnimatedCard = Animated.createAnimatedComponent(Card);
AnimatedCard.displayName = 'AnimatedCard';
