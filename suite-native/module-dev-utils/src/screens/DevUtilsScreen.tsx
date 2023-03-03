import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { isDebugEnv, isDevelopOrDebugEnv } from '@suite-native/config';
import { Box, Button, Card, CheckBox, Text, useDebugView, VStack } from '@suite-native/atoms';
import {
    Screen,
    StackProps,
    DevUtilsStackParamList,
    DevUtilsStackRoutes,
    ScreenHeader,
} from '@suite-native/navigation';
import { purgeStorage, useStoragePersistor } from '@suite-native/storage';
import { selectLogs } from '@suite-common/logger';
import { useCopyToClipboard } from '@suite-native/helpers';

import { BuildInfo } from '../components/BuildInfo';

const DevCheckBoxListItem = ({
    title,
    onPress,
    isChecked,
}: {
    title: string;
    onPress: () => void;
    isChecked: boolean;
}) => (
    <TouchableOpacity onPress={onPress}>
        <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            paddingVertical="small"
        >
            <Text variant="body">{title}</Text>
            <CheckBox isChecked={isChecked} onChange={onPress} />
        </Box>
    </TouchableOpacity>
);

const Log = () => {
    const logs = useSelector(selectLogs);
    const copyToClipboard = useCopyToClipboard();

    const handleCopy = async () => {
        await copyToClipboard(JSON.stringify(logs), 'Logs copied to clipboard.');
    };

    return (
        <Box>
            <Button onPress={handleCopy}>Copy</Button>
            <Text>{JSON.stringify(logs)}</Text>
        </Box>
    );
};

export const DevUtilsScreen = ({
    navigation,
}: StackProps<DevUtilsStackParamList, DevUtilsStackRoutes.DevUtils>) => {
    const persistor = useStoragePersistor();
    const {
        toggleFlashOnRerender,
        toggleRerenderCount,
        isFlashOnRerenderEnabled,
        isRerenderCountEnabled,
    } = useDebugView();
    const [areLogsVisible, setAreLogsVisible] = useState(false);

    const handleResetStorage = () => {
        purgeStorage(persistor);
    };

    return (
        <Screen header={<ScreenHeader title="DEV utils" hasGoBackIcon />}>
            {isDevelopOrDebugEnv() ? (
                <Box marginBottom="large">
                    <Box
                        flexDirection="row"
                        justifyContent="space-between"
                        alignItems="center"
                        marginBottom="large"
                    >
                        <Box>
                            <Text color="textSubdued" variant="hint">
                                This section is shown only in local and develop builds! (Not in
                                staging and production environments)
                            </Text>
                        </Box>
                    </Box>
                    <VStack spacing="medium">
                        {!isDebugEnv() && <BuildInfo />}

                        <Card style={{ marginVertical: 16 }}>
                            <DevCheckBoxListItem
                                title="Flash on rerender"
                                onPress={toggleFlashOnRerender}
                                isChecked={isFlashOnRerenderEnabled}
                            />
                            <DevCheckBoxListItem
                                title="Show rerender count"
                                onPress={toggleRerenderCount}
                                isChecked={isRerenderCountEnabled}
                            />
                        </Card>

                        <Card>
                            <Box flexDirection="row" justifyContent="space-between">
                                <Text>Show logs</Text>
                                <CheckBox
                                    isChecked={areLogsVisible}
                                    onChange={() => setAreLogsVisible(!areLogsVisible)}
                                />
                            </Box>
                        </Card>
                        <Button onPress={() => navigation.navigate(DevUtilsStackRoutes.Demo)}>
                            See Component Demo
                        </Button>
                        <Button colorScheme="primary" onPress={handleResetStorage}>
                            Reset storage
                        </Button>

                        {areLogsVisible && <Log />}
                    </VStack>
                </Box>
            ) : null}
        </Screen>
    );
};
