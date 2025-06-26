import { Text, VStack } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { Screen } from '@suite-native/navigation';
import { getSuiteVersion } from '@trezor/env-utils';

import { ConnectionSettings } from '../components/ConnectionSettings';
import { FeaturesSettings } from '../components/FeaturesSettings';
import { PreferencesSettings } from '../components/PreferencesSettings';

export const SettingsScreen = () => (
    <Screen header={<DeviceManagerScreenHeader />}>
        <VStack marginTop="sp16" spacing="sp40">
            <PreferencesSettings />
            <FeaturesSettings />
            <ConnectionSettings />
            <VStack justifyContent="center" alignItems="center" marginBottom="sp24">
                <Icon name="trezorLogo" size="large" color="iconSubdued" />
                <Text variant="callout" color="textSubdued">
                    <Translation id="generic.trezorSuiteLite" />
                </Text>
                <Text color="textSubdued">{getSuiteVersion()}</Text>
            </VStack>
        </VStack>
    </Screen>
);
