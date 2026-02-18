import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Box, Card, HStack, Switch, Text, VStack } from '@suite-native/atoms';
import { selectAreTestnetsEnabled, toggleAreTestnetsEnabled } from '@suite-native/settings';

export const TestnetsToggle = () => {
    const areTestnetsEnabled = useSelector(selectAreTestnetsEnabled);
    const dispatch = useDispatch();

    const handleToggle = () => {
        dispatch(toggleAreTestnetsEnabled());
    };

    return (
        <Card>
            <VStack>
                <Text variant="headline-sm">Testnet coins & features</Text>
                <HStack spacing="sp24">
                    <Box flexShrink={1}>
                        <Text variant="body-sm" color="textSubdued">
                            These coins carry no value and cannot be used to pay transactions. They
                            are used only for testing.
                        </Text>
                    </Box>
                    <Switch isChecked={areTestnetsEnabled} onChange={handleToggle} />
                </HStack>
            </VStack>
        </Card>
    );
};
