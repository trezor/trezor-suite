import React, { ReactNode } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { NativeStyleObject } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { Card } from './Card';
import { CardAlert } from './CardAlert';
import { InlineAlertBoxProps } from '../InlineAlertBox/InlineAlertBox';

const ALERT_TEST_ID = '@atom/card/alert/';

export type CardWithAlertProps = {
    children: ReactNode;
    style?: NativeStyleObject;
    noPadding?: boolean;
    noShadow?: boolean;
    borderColor?: Color;
    alertProps?: InlineAlertBoxProps;
    alertPosition?: 'top' | 'bottom';
    testID?: string;
};

export const CardWithAlert = React.forwardRef<View, CardWithAlertProps>(
    (
        {
            children,
            alertPosition: alertPositionProp,
            alertProps,
            ...cardProps
        }: CardWithAlertProps,
        ref,
    ) => {
        const isAlertDisplayed = !!alertProps;
        const alertPosition = isAlertDisplayed ? (alertPositionProp ?? 'top') : undefined;

        return (
            <Card
                {...cardProps}
                header={
                    alertPosition === 'top' &&
                    alertProps && (
                        <CardAlert alertProps={alertProps} testID={ALERT_TEST_ID + 'top'} />
                    )
                }
                footer={
                    alertPosition === 'bottom' &&
                    alertProps && (
                        <CardAlert
                            alertProps={alertProps}
                            position="bottom"
                            testID={ALERT_TEST_ID + 'bottom'}
                        />
                    )
                }
                ref={ref}
            >
                {children}
            </Card>
        );
    },
);

CardWithAlert.displayName = 'CardWithAlert';
export const AnimatedCardWithAlert = Animated.createAnimatedComponent(CardWithAlert);
AnimatedCardWithAlert.displayName = 'AnimatedCardWithAlert';
