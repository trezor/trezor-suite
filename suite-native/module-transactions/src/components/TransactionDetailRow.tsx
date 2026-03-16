import { type ReactNode } from 'react';

import { G } from '@mobily/ts-belt';

import { Box, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type TransactionDetailRowProps = {
    title: string;
    children: ReactNode;
};

const rowStyle = prepareNativeStyle(() => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
}));

const valueContainerStyle = prepareNativeStyle(_ => ({
    flexShrink: 1,
}));

export const TransactionDetailRow = ({ title, children }: TransactionDetailRowProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(rowStyle)}>
            <Text variant="body-sm" color="textSubdued">
                {title}
            </Text>
            <Box
                flexDirection="row"
                justifyContent="flex-end"
                alignItems="center"
                style={applyStyle(valueContainerStyle)}
            >
                {G.isString(children) || G.isNumber(children) ? <Text>{children}</Text> : children}
            </Box>
        </Box>
    );
};
