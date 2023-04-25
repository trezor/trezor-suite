import React, { ReactNode } from 'react';

import { Box, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type AccountImportSummarySectionProps = {
    title: string;
    children: ReactNode;
};

const contentWrapperStyle = prepareNativeStyle(_ => ({
    width: '100%',
    flex: 1,
    marginTop: 70,
}));

export const AccountImportSummarySection = ({
    title,
    children,
}: AccountImportSummarySectionProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box alignItems="center" flex={1} justifyContent="space-between">
            <Text data-testID="@account-import/coin-synced/success-text" variant="titleMedium">
                {title}
            </Text>
            <Box style={applyStyle(contentWrapperStyle)}>{children}</Box>
        </Box>
    );
};
