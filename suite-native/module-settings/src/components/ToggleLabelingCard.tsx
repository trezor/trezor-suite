import { useSelector } from 'react-redux';

import { useLocalFirstStorage } from '@suite-common/local-first-storage';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { Card, CardWithIconLayout, HStack, Switch, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useLocalFirstStorageAlerts } from '@suite-native/local-first-storage';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const toggleCardStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundTertiaryDefaultOnElevation1,
    paddingHorizontal: utils.spacings.sp16,
    paddingVertical: utils.spacings.sp12,
}));

export const ToggleLabelingCard = () => {
    const { applyStyle } = useNativeStyles();

    const { showLocalFirstStorageDisableConfirmationAlert } = useLocalFirstStorageAlerts();
    const selectedDevice = useSelector(selectSelectedDevice);
    const { isLocalFirstStorageEnabled, enableLocalFirstStorageIfNeeded } = useLocalFirstStorage({
        device: selectedDevice,
    });

    const toggleLocalFirstStorage = () =>
        isLocalFirstStorageEnabled
            ? showLocalFirstStorageDisableConfirmationAlert()
            : enableLocalFirstStorageIfNeeded();

    return (
        <CardWithIconLayout
            icon="arrowsClockwise"
            title={
                <Text variant="highlight">
                    <Translation id="moduleSettings.secureSync.title" />
                </Text>
            }
        >
            <VStack spacing={16}>
                <Text variant="hint" color="textSubdued">
                    <Translation id="moduleSettings.secureSync.description" />
                </Text>
                <Card noPadding style={applyStyle(toggleCardStyle)} noShadow>
                    <HStack justifyContent="space-between" alignItems="center">
                        <Text>
                            <Translation
                                id={
                                    isLocalFirstStorageEnabled
                                        ? 'moduleSettings.secureSync.disable'
                                        : 'moduleSettings.secureSync.enable'
                                }
                            />
                        </Text>
                        <Switch
                            isChecked={isLocalFirstStorageEnabled}
                            onChange={toggleLocalFirstStorage}
                            testID="settings/secure-sync-switch"
                        />
                    </HStack>
                </Card>
            </VStack>
        </CardWithIconLayout>
    );
};
