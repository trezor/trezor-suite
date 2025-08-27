import React from 'react';
import { View } from 'react-native';

import { InlineAlertBoxProps } from '../InlineAlertBox/InlineAlertBox';
import { CardProps } from './Card';
import { CardWithAlert } from './CardWithAlert';

const ALERT_TEST_ID = '@atom/card/alert/bottom';

type CardWithBottomAlertProps = CardProps & {
    alertProps: InlineAlertBoxProps;
};

export const CardWithBottomAlert = React.forwardRef<View, CardWithBottomAlertProps>(
    (props: CardWithBottomAlertProps, ref) => {
        return (
            <CardWithAlert
                {...props}
                alertPosition="bottom"
                alertTestId={ALERT_TEST_ID}
                ref={ref}
            />
        );
    },
);

CardWithBottomAlert.displayName = 'CardWithBottomAlert';