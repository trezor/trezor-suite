import { useDispatch, useSelector } from 'react-redux';

import { Screen, ScreenSubHeader } from '@suite-native/navigation';
import { Box, Button, Card, HStack, IconButton, Text } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { selectPhysicalDevices, toggleRememberDevice } from '@suite-common/wallet-core';
import { TrezorDevice } from '@suite-common/suite-types';

export const SettingsViewOnly = () => {
    const dispatch = useDispatch();
    const { translate } = useTranslate();

    const devices = useSelector(selectPhysicalDevices);

    const handleViewOnlyChange = (device: TrezorDevice) => {
        dispatch(toggleRememberDevice({ device }));
    };

    return (
        <Screen
            screenHeader={<ScreenSubHeader content={translate('moduleSettings.viewOnly.title')} />}
        >
            <Box marginVertical="medium" marginHorizontal="extraLarge" alignItems="center">
                <Text variant="hint" textAlign="center">
                    {devices.length ? (
                        <Translation id="moduleSettings.viewOnly.subtitle" />
                    ) : (
                        <Translation id="moduleSettings.viewOnly.emptySubitle" />
                    )}
                </Text>
            </Box>
            {devices.map(device => (
                <Card key={device.id}>
                    <HStack justifyContent="space-between" alignItems="center">
                        <Text>{device?.label}</Text>
                        {device.remember ? (
                            <IconButton
                                colorScheme="redElevation0"
                                iconName="close"
                                onPress={() => handleViewOnlyChange(device)}
                            />
                        ) : (
                            <Button onPress={() => handleViewOnlyChange(device)}>
                                <Translation id="moduleSettings.viewOnly.enableButton" />
                            </Button>
                        )}
                    </HStack>
                </Card>
            ))}
        </Screen>
    );
};
