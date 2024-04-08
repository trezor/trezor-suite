import { ReactNode } from 'react';
import { View } from 'react-native';

import { RequireAllOrNone } from 'type-fest';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { AlertBox, AlertBoxProps } from '../AlertBox';

export type CardProps = {
    children: ReactNode;
    style?: NativeStyleObject;
} & RequireAllOrNone<
    { alertVariant: AlertBoxProps['variant']; alertTitle: AlertBoxProps['title'] },
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

const alertBoxWrapperStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderTopLeftRadius: utils.borders.radii.medium,
    borderTopRightRadius: utils.borders.radii.medium,
    paddingHorizontal: utils.spacings.extraSmall,
    paddingTop: utils.spacings.extraSmall,
}));

export const Card = ({ children, style, alertVariant, alertTitle }: CardProps) => {
    const { applyStyle } = useNativeStyles();

    const isAlertDisplayed = !!alertVariant;

    return (
        <View>
            {isAlertDisplayed && (
                <View style={applyStyle(alertBoxWrapperStyle)}>
                    <AlertBox variant={alertVariant} title={alertTitle} borderRadius={12} />
                </View>
            )}
            {/* CAUTION: in case that alert is displayed, it is not possible to change styles of the top borders by the `style` prop. */}
            <View style={[applyStyle(cardContainerStyle, { isAlertDisplayed }), style]}>
                {children}
            </View>
        </View>
    );
};
