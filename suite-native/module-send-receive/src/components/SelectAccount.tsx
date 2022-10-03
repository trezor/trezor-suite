import React, { useState } from 'react';

import { Box, SearchInput, Text, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const buttonsWrapperStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.extraLarge,
}));

export const SelectAccount = () => {
    const [inputText, setInputText] = useState<string>('');
    const { applyStyle } = useNativeStyles();

    return (
        <Box flexDirection="column" style={applyStyle(buttonsWrapperStyle)}>
            <VStack spacing={10}>
                <Text variant="highlight">To account</Text>
                <SearchInput
                    value={inputText}
                    onChange={setInputText}
                    placeholder='Search "Bitcoin"'
                />
            </VStack>
        </Box>
    );
};
