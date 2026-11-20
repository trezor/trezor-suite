import { useSelector } from 'react-redux';

import { selectIsThpDevice } from '@suite-common/device';
import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { AutoConnectCard } from '../components/AutoConnectCard';
import { ForgetDeviceCard } from '../components/ForgetDeviceCard';

export const DeviceConnectionScreen = () => {
    const isThpDevice = useSelector(selectIsThpDevice);

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
                {isThpDevice && <AutoConnectCard />}
                <ForgetDeviceCard />
            </VStack>
        </Screen>
    );
};
