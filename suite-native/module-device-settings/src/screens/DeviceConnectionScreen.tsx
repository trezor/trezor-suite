import { useSelector } from 'react-redux';

import { selectIsDeviceConnectedViaBluetooth } from '@suite-common/device';
import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { AutoConnectCard } from '../components/AutoConnectCard';
import { ForgetDeviceCard } from '../components/ForgetDeviceCard';
import { UnpairBluetoothDeviceCard } from '../components/UnpairBluetoothDeviceCard';

export const DeviceConnectionScreen = () => {
    const isDeviceConnectedViaBluetooth = useSelector(selectIsDeviceConnectedViaBluetooth);

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={<Translation id="moduleDeviceSettings.connection.title" />}
                    closeActionType="back"
                />
            }
        >
            <VStack spacing="sp16">
                <AutoConnectCard />
                <ForgetDeviceCard />
                {isDeviceConnectedViaBluetooth && <UnpairBluetoothDeviceCard />}
            </VStack>
        </Screen>
    );
};
