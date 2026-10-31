import { type ReactNode } from 'react';

import { Box, Text } from '@suite-native/atoms';
import { useNativeStyles } from '@trezor/styles-native';

import { priceChartGraphStyle } from './priceChartGraphStyle';

type PriceChartNoteProps = {
    children: ReactNode;
    testID: string;
};

export const PriceChartNote = ({ children, testID }: PriceChartNoteProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box
            alignItems="center"
            justifyContent="center"
            style={applyStyle(priceChartGraphStyle)}
            testID={testID}
        >
            <Text variant="body-sm" color="contentSecondary" textAlign="center">
                {children}
            </Text>
        </Box>
    );
};
