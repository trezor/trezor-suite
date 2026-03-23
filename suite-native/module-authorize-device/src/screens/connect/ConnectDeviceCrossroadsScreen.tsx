import { useDispatch } from 'react-redux';

import { bluetoothActions } from '@suite-common/bluetooth';
import {
    Box,
    Card,
    HStack,
    Image,
    PressableOpacity,
    RoundedIcon,
    Text,
    TextDivider,
    VStack,
} from '@suite-native/atoms';
import { type IconName } from '@suite-native/icons';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import {
    type AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    type RootStackParamList,
    type StackToStackCompositeScreenProps,
} from '@suite-native/navigation';

import { ConnectDeviceScreen } from '../../components/connect/ConnectDeviceScreen';

type ConnectCardProps = {
    image: string;
    title: TxKeyPath;
    subtitle: TxKeyPath;
    icon: IconName;
    onPress: () => void;
};

const ConnectCard = ({ image, title, subtitle, icon, onPress }: ConnectCardProps) => (
    <Card>
        <PressableOpacity onPress={onPress}>
            <VStack marginTop="sp16" spacing="sp24" alignItems="center">
                <Image source={image} width={228} height={128} contentFit="contain" />
                <Box alignItems="center">
                    <Text variant="headline-sm">
                        <Translation
                            id={title}
                            values={{
                                bold: chunks => (
                                    <Text
                                        key={1}
                                        variant="headline-sm"
                                        style={{ fontWeight: 'bold' }}
                                    >
                                        {chunks}
                                    </Text>
                                ),
                            }}
                        />
                    </Text>
                    <HStack alignItems="center">
                        <Text variant="headline-sm">
                            <Translation id={subtitle} />
                        </Text>
                        <RoundedIcon name={icon} iconSize="mediumLarge" containerSize={28} />
                    </HStack>
                </Box>
            </VStack>
        </PressableOpacity>
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
                <ConnectCard
                    image={require('../../assets/devices-bluetooth.webp')}
                    title="moduleConnectDevice.crossroads.bluetooth.title"
                    subtitle="moduleConnectDevice.crossroads.bluetooth.subtitle"
                    icon="bluetooth"
                    onPress={navigateToTurnOnAndUnlockDeviceScreen}
                />
                <TextDivider />
                <ConnectCard
                    image={require('../../assets/devices-cable.webp')}
                    title="moduleConnectDevice.crossroads.cable.title"
                    subtitle="moduleConnectDevice.crossroads.cable.subtitle"
                    icon="cableUsbC"
                    onPress={navigateToConnectAndUnlockDeviceScreen}
                />
            </VStack>
        </ConnectDeviceScreen>
    );
};
