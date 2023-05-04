import React, { ReactNode } from 'react';

import { G } from '@mobily/ts-belt';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles/src';
import { Box, Text } from '@suite-native/atoms/src';

type TransactionDetailRowProps = {
    title: string;
    children: ReactNode;
};

const rowStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: utils.spacings.small,
}));

export const TransactionDetailRow = ({ title, children }: TransactionDetailRowProps) => {
    const { applyStyle } = useNativeStyles();
    return (
        <Box style={applyStyle(rowStyle)}>
            <Text color="textSubdued">{title}</Text>
            <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                {G.isString(children) || G.isNumber(children) ? <Text>{children}</Text> : children}
            </Box>
        </Box>
    );
};
