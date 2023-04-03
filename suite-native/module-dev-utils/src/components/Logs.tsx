import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import { selectLogs } from '@suite-common/logger';
import { Box, Card, CheckBox, Stack, Text } from '@suite-native/atoms';

import { CopyLogsButton } from './CopyLogsButton';

export const Logs = () => {
    const logs = useSelector(selectLogs);
    const [areLogsVisible, setAreLogsVisible] = useState(false);

    return (
        <>
            <Card>
                <Box flexDirection="row" justifyContent="space-between">
                    <Text>Show logs</Text>
                    <CheckBox
                        isChecked={areLogsVisible}
                        onChange={() => setAreLogsVisible(!areLogsVisible)}
                    />
                </Box>
            </Card>
            {areLogsVisible && (
                <Stack>
                    <CopyLogsButton />
                    <Box>
                        <Text>{JSON.stringify(logs)}</Text>
                    </Box>
                </Stack>
            )}
        </>
    );
};
