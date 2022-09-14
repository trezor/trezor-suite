import React from 'react';

import { isDevelopOrDebugEnv } from '@suite-native/config';
import { Box, Button } from '@suite-native/atoms';

type DevButtonProps = {
    devButtonsVisible: boolean;
    onDevButtonsChangeVisibility: (visible: boolean) => void;
};

export const DevButton = ({ devButtonsVisible, onDevButtonsChangeVisibility }: DevButtonProps) => {
    if (isDevelopOrDebugEnv()) {
        return (
            <Box marginLeft="medium">
                <Button onPress={() => onDevButtonsChangeVisibility(!devButtonsVisible)}>
                    {devButtonsVisible ? 'Hide DEV' : 'Show DEV'}
                </Button>
            </Box>
        );
    }

    return null;
};
