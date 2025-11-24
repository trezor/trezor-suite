import { Pressable } from 'react-native';
import { useDispatch } from 'react-redux';

import { bluetoothActions } from '@suite-common/bluetooth';
import {
    Box,
    Card,
    HStack,
    Image,
    RoundedIcon,
    Text,
    TextDivider,
    VStack,
} from '@suite-native/atoms';
import { IconName } from '@suite-native/icons';
import { Translation, TxKeyPath } from '@suite-native/intl';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    StackToStackCompositeScreenProps,
} from '@suite-native/navigation';

import { ConnectDeviceScreen } from '../../components/connect/ConnectDeviceScreen';

type ConnectCardProps = {
    image: string;
    title: TxKeyPath;
    subtitle: TxKeyPath;
    icon: IconName;
};

const ConnectCard = ({ image, title, subtitle, icon }: ConnectCardProps) => (
    <Card>
        <VStack marginTop="sp16" spacing="sp24" alignItems="center">
            <Image source={image} width={228} height={128} contentFit="contain" />
            <Box alignItems="center">
                <Text variant="titleSmall">
                    <Translation
                        id={title}
                        values={{
                            bold: chunks => (
                                <Text key={1} variant="titleSmall" style={{ fontWeight: 'bold' }}>
                                    {chunks}
                                </Text>
                            ),
                        }}
                    />
                </Text>
                <HStack alignItems="center">
                    <Text variant="titleSmall">
                        <Translation id={subtitle} />
                    </Text>
                    <RoundedIcon name={icon} iconSize="mediumLarge" containerSize={28} />
                </HStack>
            </Box>
        </VStack>
    </Card>
);

export const ConnectDeviceCrossroadsScreen = ({
    navigation,
}: StackToStackCompositeScreenProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.ConnectDeviceCrossroads,
    RootStackParamList
>) => {
    const dispatch = useDispatch();

    const navigateToTurnOnAndUnlockDeviceScreen = () => {
        // Make sure auto-connect is enabled in case some device was manually disconnected.
        dispatch(bluetoothActions.enableAutoConnect());
        navigation.navigate(AuthorizeDeviceStackRoutes.TurnOnAndUnlockDevice);
    };

    const navigateToConnectAndUnlockDeviceScreen = () => {
        navigation.navigate(AuthorizeDeviceStackRoutes.ConnectAndUnlockDevice);
    };

    return (
        <ConnectDeviceScreen>
            <VStack marginTop="sp16" spacing="sp16">
                <Pressable onPress={navigateToTurnOnAndUnlockDeviceScreen}>
                    <ConnectCard
                        image={require('../../assets/devices-bluetooth.webp')}
                        title="moduleConnectDevice.crossroads.bluetooth.title"
                        subtitle="moduleConnectDevice.crossroads.bluetooth.subtitle"
                        icon="bluetooth"
                    />
                </Pressable>
                <TextDivider />
                <Pressable onPress={navigateToConnectAndUnlockDeviceScreen}>
                    <ConnectCard
                        image={require('../../assets/devices-cable.webp')}
                        title="moduleConnectDevice.crossroads.cable.title"
                        subtitle="moduleConnectDevice.crossroads.cable.subtitle"
                        icon="cableUsbC"
                    />
                </Pressable>
            </VStack>
        </ConnectDeviceScreen>
    );
};
