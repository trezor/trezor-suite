import React from 'react';
import { View } from 'react-native';

import { InlineAlertBoxProps } from '../InlineAlertBox/InlineAlertBox';
import { CardProps } from './Card';
import { CardWithAlert } from './CardWithAlert';

const ALERT_TEST_ID = '@atom/card/alert/top';

type CardWithTopAlertProps = CardProps & {
    alertProps: InlineAlertBoxProps;
};

export const CardWithTopAlert = React.forwardRef<View, CardWithTopAlertProps>(
    (props: CardWithTopAlertProps, ref) => {
        return (
            <CardWithAlert
                {...props}
                alertPosition="top"
                alertTestId={ALERT_TEST_ID}
                ref={ref}
            />
        );
    },
);

CardWithTopAlert.displayName = 'CardWithTopAlert';