import React from 'react';
import { View } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { InlineAlertBox, InlineAlertBoxProps } from '../InlineAlertBox/InlineAlertBox';
import { Card, CardProps } from './Card';

const ALERT_TEST_ID = '@atom/card/alert/top';

type CardWithTopAlertProps = CardProps & {
    alertProps: InlineAlertBoxProps;
};

const cardOuterContainerStyle = prepareNativeStyle<{
    flex?: number;
}>((_, { flex }) => ({
    flex,
}));

const cardInnerContainerStyle = prepareNativeStyle<{
    noPadding: boolean;
    borderColor?: CardProps['borderColor'];
    noShadow?: boolean;
}>((utils, { noPadding, borderColor, noShadow }) => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderRadius: utils.borders.radii.r16,
    padding: utils.spacings.sp16,
    // Remove top border radius to connect with alert
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,

    extend: [
        {
            condition: !!borderColor,
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

const alertBoxWrapperStyle = prepareNativeStyle((utils) => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    paddingHorizontal: utils.spacings.sp4,
    borderTopLeftRadius: utils.borders.radii.r16,
    borderTopRightRadius: utils.borders.radii.r16,
    paddingTop: utils.spacings.sp4,
}));

export const CardWithTopAlert = React.forwardRef<View, CardWithTopAlertProps>(
    (
        {
            children,
            style,
            alertProps,
            borderColor,
            noPadding = false,
            noShadow = false,
            ...restProps
        }: CardWithTopAlertProps,
        ref,
    ) => {
        const { applyStyle } = useNativeStyles();

        return (
            <View style={applyStyle(cardOuterContainerStyle, { flex: style?.flex })} {...restProps}>
                <View
                    style={applyStyle(alertBoxWrapperStyle)}
                    testID={ALERT_TEST_ID}
                >
                    <InlineAlertBox {...alertProps} />
                </View>
                <View
                    style={[
                        applyStyle(cardInnerContainerStyle, {
                            noPadding,
                            borderColor,
                            noShadow,
                        }),
                        style,
                    ]}
                    ref={ref}
                >
                    {children}
                </View>
            </View>
        );
    },
);

CardWithTopAlert.displayName = 'CardWithTopAlert';