import { Button, Card, PictogramTitleHeader, VStack } from '@suite-native/atoms';
import { Translation, TxKeyPath } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { useDeviceAutoConnect } from '../hooks/useDeviceAutoConnect';

type CardConfig = {
    pictogramVariant: 'success' | 'info';
    pictogramIcon: 'check' | 'x';
    titleId: TxKeyPath;
    subtitleId: TxKeyPath;
    buttonId: TxKeyPath;
};

const configMap = {
    enabled: {
        pictogramVariant: 'success',
        pictogramIcon: 'check',
        titleId: 'moduleDeviceSettings.autoconnect.enable.pictogramTitle',
        subtitleId: 'moduleDeviceSettings.autoconnect.disable.description',
        buttonId: 'moduleDeviceSettings.autoconnect.enable.turnOffButton',
    },
    disabled: {
        pictogramVariant: 'info',
        pictogramIcon: 'x',
        titleId: 'moduleDeviceSettings.autoconnect.disable.pictogramTitle',
        subtitleId: 'moduleDeviceSettings.autoconnect.enable.description',
        buttonId: 'moduleDeviceSettings.autoconnect.disable.turnOnButton',
    },
} as const satisfies Record<'enabled' | 'disabled', CardConfig>;

export const DeviceAutoConnectScreen = () => {
    const { isAutoConnectEnabled, toggleAutoConnect } = useDeviceAutoConnect();

    const { pictogramVariant, pictogramIcon, titleId, subtitleId, buttonId } =
        configMap[isAutoConnectEnabled ? 'enabled' : 'disabled'];

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={<Translation id="moduleDeviceSettings.autoconnect.settingsCard.title" />}
                    subtitle={<Translation id="moduleDeviceSettings.autoconnect.screen.subtitle" />}
                    closeActionType="back"
                />
            }
        >
            <Card>
                <VStack spacing="sp32">
                    <PictogramTitleHeader
                        variant={pictogramVariant}
                        icon={pictogramIcon}
                        title={<Translation id={titleId} />}
                        subtitle={<Translation id={subtitleId} />}
                    />
                    <Button onPress={toggleAutoConnect} colorScheme="primary" size="medium">
                        <Translation id={buttonId} />
                    </Button>
                </VStack>
            </Card>
        </Screen>
    );
};
