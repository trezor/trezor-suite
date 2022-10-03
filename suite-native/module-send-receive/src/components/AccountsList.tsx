import React, { useState } from 'react';

import { Box, Button, SearchInput, Text, VStack } from '@suite-native/atoms';
import { sendReceiveContentType, SendReceiveContentType } from '../contentType';

type SelectAccountProps = {
    onChangeContent: (type: SendReceiveContentType) => void;
};

export const AccountsList = ({ onChangeContent }: SelectAccountProps) => {
    const [inputText, setInputText] = useState<string>('');

    return (
        <Box flexDirection="column">
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
