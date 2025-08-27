import React from 'react';
import { View } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { InlineAlertBox, InlineAlertBoxProps } from '../InlineAlertBox/InlineAlertBox';
import { CardProps } from './Card';

export type AlertPosition = 'top' | 'bottom';

export type CardWithAlertProps = CardProps & {
    alertProps: InlineAlertBoxProps;
    alertPosition: AlertPosition;
    alertTestId: string;
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
    alertPosition: AlertPosition;
}>((utils, { noPadding, borderColor, noShadow, alertPosition }) => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderRadius: utils.borders.radii.r16,
    padding: utils.spacings.sp16,
    // Remove border radius on the side connecting to alert
    ...(alertPosition === 'top' && {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
    }),
    ...(alertPosition === 'bottom' && {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    }),

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

const alertBoxWrapperStyle = prepareNativeStyle<{
    alertPosition: AlertPosition;
}>((utils, { alertPosition }) => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    paddingHorizontal: utils.spacings.sp4,
    ...(alertPosition === 'top' && {
        borderTopLeftRadius: utils.borders.radii.r16,
        borderTopRightRadius: utils.borders.radii.r16,
        paddingTop: utils.spacings.sp4,
    }),
    ...(alertPosition === 'bottom' && {
        borderBottomLeftRadius: utils.borders.radii.r16,
        borderBottomRightRadius: utils.borders.radii.r16,
        paddingBottom: utils.spacings.sp4,
    }),
}));

export const CardWithAlert = React.forwardRef<View, CardWithAlertProps>(
    (
        {
            children,
            style,
            alertProps,
            alertPosition,
            alertTestId,
            borderColor,
            noPadding = false,
            noShadow = false,
            ...restProps
        }: CardWithAlertProps,
        ref,
    ) => {
        const { applyStyle } = useNativeStyles();

        const cardContent = (
            <View
                style={[
                    applyStyle(cardInnerContainerStyle, {
                        noPadding,
                        borderColor,
                        noShadow,
                        alertPosition,
                    }),
                    style,
                ]}
                ref={ref}
            >
                {children}
            </View>
        );

        const alertContent = (
            <View
                style={applyStyle(alertBoxWrapperStyle, { alertPosition })}
                testID={alertTestId}
            >
                <InlineAlertBox {...alertProps} />
            </View>
        );

        return (
            <View style={applyStyle(cardOuterContainerStyle, { flex: style?.flex })} {...restProps}>
                {alertPosition === 'top' ? (
                    <>
                        {alertContent}
                        {cardContent}
                    </>
                ) : (
                    <>
                        {cardContent}
                        {alertContent}
                    </>
                )}
            </View>
        );
    },
);

CardWithAlert.displayName = 'CardWithAlert';