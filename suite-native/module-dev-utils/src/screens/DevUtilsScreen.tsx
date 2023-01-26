import React from 'react';
import { TouchableOpacity } from 'react-native';

import { isDebugEnv, isDevelopOrDebugEnv } from '@suite-native/config';
import { Box, Button, Card, CheckBox, Text, useDebugView, VStack } from '@suite-native/atoms';
import {
    Screen,
    StackProps,
    DevUtilsStackParamList,
    DevUtilsStackRoutes,
} from '@suite-native/navigation';
import { purgeStorage, useStoragePersistor } from '@suite-native/storage';

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

    const handleResetStorage = () => {
        purgeStorage(persistor);
    };

    return (
        <Screen>
            {isDevelopOrDebugEnv() ? (
                <Box marginBottom="large">
                    <Box
                        flexDirection="row"
                        justifyContent="space-between"
                        alignItems="center"
                        marginBottom="large"
                    >
                        <Box>
                            <Text variant="titleMedium">DEV utils</Text>
                            <Text color="gray600" variant="hint">
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

                        <Button onPress={() => navigation.navigate(DevUtilsStackRoutes.Demo)}>
                            See Component Demo
                        </Button>
                        <Button colorScheme="primary" onPress={handleResetStorage}>
                            Reset storage
                        </Button>
                    </VStack>
                </Box>
            ) : null}
        </Screen>
    );
};
