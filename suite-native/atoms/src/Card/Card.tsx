import React, { type ComponentProps, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { type NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';
import { isNotNullOrUndefined } from '@trezor/utils';

import { InlineAlertBox, type InlineAlertBoxProps } from '../InlineAlertBox/InlineAlertBox';

const CARD_CONTAINER_TEST_ID = '@atom/card/container';
const ALERT_TEST_ID = '@atom/card/alert/';

type AlertPosition = 'top' | 'bottom';

export type CardProps = {
    children: ReactNode;
    style?: NativeStyleObject;
    noPadding?: boolean;
    noShadow?: boolean;
    borderColor?: Color;
    alertProps?: InlineAlertBoxProps;
    alertPosition?: AlertPosition;
    testID?: string;
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
    noShadow?: boolean;
}>((utils, { alertPosition, noPadding, borderColor, noShadow }) => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderRadius: utils.borders.radii.r16,
    padding: utils.spacings.sp16,

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
            condition: isNotNullOrUndefined(borderColor),
            style: {
                borderColor: utils.colors[borderColor!],
                borderWidth: utils.borders.widths.small,
            },
        },
        {
            condition: noPadding,
            style: {
                padding: 0,
            },
        },
        {
            condition: !noShadow,
            style: { ...utils.boxShadows.small },
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
        {
            children,
            style,
            alertProps,
            alertPosition: alertPositionProp,
            borderColor,
            noPadding = false,
            noShadow = false,
            testID,
        }: CardProps,
        ref,
    ) => {
        const { applyStyle } = useNativeStyles();

        const isAlertDisplayed = !!alertProps;
        const alertPosition = isAlertDisplayed ? (alertPositionProp ?? 'top') : undefined;

        return (
            <View
                style={applyStyle(cardOuterContainerStyle, { flex: style?.flex })}
                testID={testID}
            >
                {isAlertDisplayed && alertPosition === 'top' && (
                    <View
                        style={applyStyle(alertBoxWrapperStyle, {
                            alertPosition,
                        })}
                        testID={ALERT_TEST_ID + 'top'}
                    >
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
                            noShadow,
                        }),
                        style,
                    ]}
                    testID={CARD_CONTAINER_TEST_ID}
                    // Ref must be here otherwise the animation will not work
                    ref={ref}
                >
                    {children}
                </View>
                {isAlertDisplayed && alertPosition === 'bottom' && (
                    <View
                        style={applyStyle(alertBoxWrapperStyle, {
                            alertPosition,
                        })}
                        testID={ALERT_TEST_ID + 'bottom'}
                    >
                        <InlineAlertBox {...alertProps} />
                    </View>
                )}
            </View>
        );
    },
);

Card.displayName = 'Card';

export type AnimatedContainerCardProps = CardProps &
    Pick<ComponentProps<typeof Animated.View>, 'layout' | 'entering' | 'exiting'> & {
        // Use for animated container styles (opacity, transform). style goes to the inner Card.
        animatedStyle?: ComponentProps<typeof Animated.View>['style'];
    };

// Wrapping in Animated.View ensures animated styles (opacity, transform) target the outermost
// container. createAnimatedComponent(Card) would drive the inner styled View instead, which
// breaks transform animations. For animated inner styles (e.g. borderColor), use AnimatedBorderCard.
export const AnimatedContainerCard = ({
    animatedStyle,
    layout,
    entering,
    exiting,
    children,
    ...cardProps
}: AnimatedContainerCardProps) => (
    <Animated.View style={animatedStyle} layout={layout} entering={entering} exiting={exiting}>
        <Card {...cardProps}>{children}</Card>
    </Animated.View>
);

// Use when animated styles target the inner card container (e.g. borderColor, borderWidth).
export const AnimatedBorderCard = Animated.createAnimatedComponent(Card);
