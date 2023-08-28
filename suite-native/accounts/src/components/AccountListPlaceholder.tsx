import React from 'react';

import { Box, Pictogram } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const PLACEHOLDER_HEIGHT = 380;

const titleVariant = prepareNativeStyle(_ => ({
    justifyContent: 'center',
    alignItems: 'center',
    height: PLACEHOLDER_HEIGHT,
}));

export const AccountListPlaceholder = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(titleVariant)}>
            <Pictogram
                variant="yellow"
                icon="searchLight"
                title="No assets found"
                subtitle="Search again"
                titleVariant="titleMedium"
            />
        </Box>
    );
};
