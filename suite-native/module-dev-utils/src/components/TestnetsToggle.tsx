import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectAreTestnetsEnabled, toggleAreTestnetsEnabled } from '@suite-native/discovery';
import { Box, HStack, Switch, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const TestnetsToggle = () => {
    const areTestnetsEnabled = useSelector(selectAreTestnetsEnabled);
    const dispatch = useDispatch();

    const handleToggle = () => {
        dispatch(toggleAreTestnetsEnabled());
    };

    return (
        <HStack flexDirection="row" alignItems="center" spacing="large">
            <Box flexShrink={1}>
                <Text>
                    <Translation id="moduleDevUtils.testnetsToggle.title" />
                </Text>
                <Text variant="hint" color="textSubdued">
                    <Translation id="moduleDevUtils.testnetsToggle.description" />
                </Text>
            </Box>
            <Switch isChecked={areTestnetsEnabled} onChange={handleToggle} />
        </HStack>
    );
};
