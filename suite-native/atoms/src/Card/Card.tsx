import React, { ReactNode } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { G } from '@mobily/ts-belt';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

const CARD_CONTENT_TEST_ID = '@atom/card/content';

export type CardProps = {
    children: ReactNode;
    header?: ReactNode;
    footer?: ReactNode;
    style?: NativeStyleObject;
    noPadding?: boolean;
    noShadow?: boolean;
    borderColor?: Color;
    testID?: string;
};

const cardOuterContainerStyle = prepareNativeStyle<{
    flex?: number;
}>((_, { flex }) => ({
    flex,
}));

const cardInnerContainerStyle = prepareNativeStyle<{
    hasHeader: boolean;
    hasFooter: boolean;
    noPadding: boolean;
    borderColor?: Color;
    noShadow?: boolean;
}>((utils, { hasHeader, hasFooter, noPadding, borderColor, noShadow }) => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderRadius: utils.borders.radii.r16,
    padding: utils.spacings.sp16,

    extend: [
        {
            condition: hasHeader,
            style: {
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
            },
        },
        {
            condition: hasFooter,
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

export const Card = React.forwardRef<View, CardProps>(
    (
        {
            children,
            header,
            footer,
            style,
            borderColor,
            noPadding = false,
            noShadow = false,
            testID,
        }: CardProps,
        ref,
    ) => {
        const { applyStyle } = useNativeStyles();

        const hasHeader = !!header;
        const hasFooter = !!footer;

        return (
            <View
                style={applyStyle(cardOuterContainerStyle, { flex: style?.flex })}
                testID={testID}
            >
                {header}
                <View
                    style={[
                        applyStyle(cardInnerContainerStyle, {
                            hasHeader,
                            hasFooter,
                            noPadding,
                            borderColor,
                            noShadow,
                        }),
                        style,
                    ]}
                    testID={CARD_CONTENT_TEST_ID}
                    ref={ref}
                >
                    {children}
                </View>
                {footer}
            </View>
        );
    },
);

Card.displayName = 'Card';
export const AnimatedCard = Animated.createAnimatedComponent(Card);
AnimatedCard.displayName = 'AnimatedCard';
