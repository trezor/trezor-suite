import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectAreTestnetsEnabled, toggleAreTestnetsEnabled } from '@suite-native/discovery';
import { Box, HStack, Switch, Text } from '@suite-native/atoms';

export const TestnetsToggle = () => {
    const areTestnetsEnabled = useSelector(selectAreTestnetsEnabled);
    const dispatch = useDispatch();

    const handleToggle = () => {
        dispatch(toggleAreTestnetsEnabled());
    };

    return (
        <HStack flexDirection="row" alignItems="center" spacing="large">
            <Box flexShrink={1}>
                <Text>Testnet coins & features</Text>
                <Text variant="hint" color="textSubdued">
                    These coins carry no value and cannot be used to pay transactions. They are used
                    only for testing.
                </Text>
            </Box>
            <Switch isChecked={areTestnetsEnabled} onChange={handleToggle} />
        </HStack>
    );
};
