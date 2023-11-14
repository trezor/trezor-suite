import { ReactNode } from 'react';
import { View } from 'react-native';

import { RequireAllOrNone } from 'type-fest';
import { G } from '@mobily/ts-belt';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { AlertBox, AlertBoxVariant } from '../AlertBox';

export type CardProps = {
    children: ReactNode;
    style?: NativeStyleObject;
} & RequireAllOrNone<
    { alertVariant: AlertBoxVariant; alertTitle: string },
    'alertVariant' | 'alertTitle'
>;

const cardContainerStyle = prepareNativeStyle<{ isAlertDisplayed: boolean }>(
    (utils, { isAlertDisplayed }) => ({
        backgroundColor: utils.colors.backgroundSurfaceElevation1,
        borderRadius: utils.borders.radii.medium,
        padding: utils.spacings.medium,
        ...utils.boxShadows.small,

        extend: {
            condition: isAlertDisplayed,
            style: {
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
            },
        },
    }),
);

export const Card = ({ children, style, alertVariant, alertTitle }: CardProps) => {
    const { applyStyle } = useNativeStyles();

    const isAlertDisplayed = !!alertVariant;

    return (
        <>
            {isAlertDisplayed && (
                <AlertBox isStandalone={false} variant={alertVariant} title={alertTitle} />
            )}
            <View style={[applyStyle(cardContainerStyle, { isAlertDisplayed }), style]}>
                {children}
            </View>
        </>
    );
};
