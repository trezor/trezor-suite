import { ReactNode } from 'react';

import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const summaryColumnStyle = prepareNativeStyle(_ => ({
    alignItems: 'center',
    justifyContent: 'center',
}));

export const SummaryRow = ({
    children,
    leftComponent,
}: {
    children: ReactNode;
    leftComponent: ReactNode;
}) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box flexDirection="row" alignItems="flex-start">
            <Box style={applyStyle(summaryColumnStyle)}>{leftComponent}</Box>
            <Box marginLeft="sp16" flex={1}>
                {children}
            </Box>
        </Box>
    );
};
