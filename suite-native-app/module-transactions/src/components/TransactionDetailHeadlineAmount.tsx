import { type ComponentProps, type ReactNode } from 'react';

import { Text } from '@suite-native/atoms';
import { SignValueFormatter } from '@suite-native/formatters';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

export const transactionDetailAmountStyle = prepareNativeStyle<{ isFailedTx: boolean }>(
    (_, { isFailedTx }) => ({
        // A row item does not shrink by default, so adjustsFontSizeToFit would never get a narrower width.
        flexShrink: 1,
        extend: {
            condition: isFailedTx,
            style: {
                textDecorationLine: 'line-through',
            },
        },
    }),
);

type TransactionDetailHeadlineAmountProps = {
    signValue: ComponentProps<typeof SignValueFormatter>['value'];
    isFailedTx: boolean;
    children: ReactNode;
};

export const TransactionDetailHeadlineAmount = ({
    signValue,
    isFailedTx,
    children,
}: TransactionDetailHeadlineAmountProps) => {
    const { applyStyle } = useNativeStyles();

    // One text run, so the sign shrinks along with the amount and stays aligned with it.
    return (
        <Text
            variant="headline-md"
            numberOfLines={1}
            adjustsFontSizeToFit
            style={applyStyle(transactionDetailAmountStyle, { isFailedTx })}
        >
            {!isFailedTx && (
                <SignValueFormatter
                    color="contentPrimary"
                    value={signValue}
                    variant="headline-md"
                />
            )}
            {children}
        </Text>
    );
};
