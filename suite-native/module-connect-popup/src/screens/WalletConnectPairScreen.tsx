import { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectSessions, walletConnectDisconnectThunk } from '@suite-common/walletconnect';
import { WalletConnectSession } from '@suite-common/walletconnect/src/walletConnectTypes';
import {
    AnimatedBox,
    Button,
    Card,
    CardDivider,
    HStack,
    IconButton,
    Text,
    VStack,
} from '@suite-native/atoms';
import { AccordionContent } from '@suite-native/atoms/src/Accordion/AccordionContent';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackNavigationProps,
} from '@suite-native/navigation';

import { ConnectAppIcon } from '../components/ConnectAppIcon';
import { WalletConnectPairBottomSheet } from '../components/WalletConnectPairBottomSheet';

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes.WalletConnectPair>;

export const SessionDetailCard = ({ session }: { session: WalletConnectSession }) => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const handleDisconnect = () => {
        dispatch(walletConnectDisconnectThunk({ topic: session.topic }));
    };
    const handleSwitchAccount = () => {
        navigation.navigate(RootStackRoutes.WalletConnectSwitchAccount, {
            sessionTopic: session.topic,
        });
    };
    const isExpanded = useSharedValue(false);
    const animatedChevronStyle = useAnimatedStyle(() => ({
        transform: [
            {
                rotate: withTiming(`${isExpanded.value ? -180 : 0}deg`, {
                    duration: 200,
                }),
            },
        ],
    }));

    return (
        <Card key={session.topic}>
            <VStack spacing={0}>
                <TouchableOpacity onPress={() => (isExpanded.value = !isExpanded.value)}>
                    <HStack spacing="sp12" alignItems="center">
                        <ConnectAppIcon
                            src={session.peer.metadata.icons[0]}
                            type="walletConnect"
                            size="medium"
                        />
                        <VStack flex={1} spacing="sp1">
                            <Text>{session.peer.metadata.name}</Text>
                            <Text color="textSubdued" numberOfLines={1}>
                                {session.peer.metadata.url}
                            </Text>
                        </VStack>
                        <AnimatedBox style={animatedChevronStyle}>
                            <Icon name="caretDown" size="mediumLarge" />
                        </AnimatedBox>
                    </HStack>
                </TouchableOpacity>
                <AccordionContent isOpened={isExpanded}>
                    <VStack spacing="sp16" paddingTop="sp16">
                        <CardDivider />
                        <Button onPress={handleDisconnect} colorScheme="tertiaryElevation0">
                            <Translation id="moduleConnectPopup.walletConnect.disconnect" />
                        </Button>
                        <Button onPress={handleSwitchAccount} colorScheme="tertiaryElevation0">
                            <Translation id="moduleConnectPopup.walletConnect.switchAccount" />
                        </Button>
                    </VStack>
                </AccordionContent>
            </VStack>
        </Card>
    );
};

export const WalletConnectPairScreen = () => {
    const sessions = useSelector(selectSessions);
    const [pairingOpened, setPairingOpened] = useState<'qr' | 'manual' | null>(null);

    return (
        <Screen
            header={
                <ScreenHeader
                    closeActionType="close"
                    content={
                        <Text>
                            <Translation id="moduleConnectPopup.walletConnect.title" />
                        </Text>
                    }
                    rightIcon={
                        <IconButton
                            colorScheme="tertiaryElevation0"
                            size="medium"
                            iconName="qrCode"
                            onPress={() => setPairingOpened('qr')}
                        />
                    }
                />
            }
        >
            <VStack
                spacing="sp24"
                justifyContent={sessions.length === 0 ? 'center' : 'flex-start'}
                flex={1}
            >
                <WalletConnectPairBottomSheet
                    pairingOpened={pairingOpened}
                    setPairingOpened={setPairingOpened}
                />
                {sessions.map(session => (
                    <SessionDetailCard key={session.topic} session={session} />
                ))}
                {sessions.length === 0 && (
                    <>
                        <Text textAlign="center" variant="titleSmall">
                            <Translation id="moduleConnectPopup.walletConnect.noConnectedApps" />
                        </Text>
                        <Text textAlign="center" color="textSubdued">
                            <Translation id="moduleConnectPopup.walletConnect.noConnectedAppsDescription" />
                        </Text>
                    </>
                )}
            </VStack>
        </Screen>
    );
};
