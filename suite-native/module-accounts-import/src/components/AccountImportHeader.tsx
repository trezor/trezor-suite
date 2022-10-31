import React from 'react';

import { Box, StepsProgressBar } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type AccountImportHeaderProps = {
    activeStep: 1 | 2 | 3;
};
const accountImportHeaderStyle = prepareNativeStyle(_ => ({
    width: '100%',
}));

export const AccountImportHeader = ({ activeStep }: AccountImportHeaderProps) => {
    const { applyStyle } = useNativeStyles();
    return (
        <Box
            flexDirection="row"
            justifyContent="center"
            alignItems="center"
            marginBottom="small"
            style={applyStyle(accountImportHeaderStyle)}
        >
            <Box>
                <StepsProgressBar activeStep={activeStep} numberOfSteps={3} />
            </Box>
        </Box>
    );
};
