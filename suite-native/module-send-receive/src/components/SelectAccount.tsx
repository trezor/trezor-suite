import React, { useState } from 'react';

import { Box, Button, SearchInput, Text, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { sendReceiveContentType, SendReceiveContentType } from '../contentType';

const buttonsWrapperStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.extraLarge,
}));

type SelectAccountProps = {
    onChangeContent: (type: SendReceiveContentType) => void;
};

export const SelectAccount = ({ onChangeContent }: SelectAccountProps) => {
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
                <Button
                    onPress={() =>
                        onChangeContent(sendReceiveContentType.createNewAddressToReceive)
                    }
                >
                    Simulate account withdrawal
                </Button>
            </VStack>
        </Box>
    );
};
