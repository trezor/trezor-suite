import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectSessions, walletConnectDisconnectThunk } from '@suite-common/walletconnect';
// TODO fix deep import
// eslint-disable-next-line local-rules/no-package-deep-imports
import { type WalletConnectSession } from '@suite-common/walletconnect/src/walletConnectTypes';
import {
    AnimatedBox,
    Button,
    Card,
    CardDivider,
    HStack,
    IconButton,
    PressableOpacity,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
// TODO fix deep import
// eslint-disable-next-line local-rules/no-package-deep-imports
import { AccordionContent } from '@suite-native/atoms/src/Accordion/AccordionContent';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    type StackNavigationProps,
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
                <PressableOpacity onPress={() => (isExpanded.value = !isExpanded.value)}>
                    <HStack spacing="sp12" alignItems="center">
                        <ConnectAppIcon
                            src={session.peer.metadata.icons?.[0]}
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
                </PressableOpacity>
                <AccordionContent isOpened={isExpanded}>
                    <VStack spacing="sp16" paddingTop="sp16">
                        <CardDivider />
                        <Button onPress={handleDisconnect} intent="neutral" priority="secondary">
                            <Translation id="moduleConnectPopup.walletConnect.disconnect" />
                        </Button>
                        <Button onPress={handleSwitchAccount} intent="neutral" priority="secondary">
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
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    return (
        <Screen
            header={
                <ScreenHeader
                    closeActionType="close"
                    title={<Translation id="moduleConnectPopup.walletConnect.title" />}
                    rightIcon={
                        <IconButton
                            intent="neutral"
                            priority="secondary"
                            iconName="qrCode"
                            onPress={openModal}
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
                <WalletConnectPairBottomSheet ref={bottomSheetRef} onClose={closeModal} />
                {sessions.map(session => (
                    <SessionDetailCard key={session.topic} session={session} />
                ))}
                {sessions.length === 0 && (
                    <>
                        <Text textAlign="center" variant="headline-sm">
                            <Translation id="moduleConnectPopup.noConnectedApps" />
                        </Text>
                        <Text textAlign="center" color="textSubdued">
                            <Translation id="moduleConnectPopup.noConnectedAppsDescription" />
                        </Text>
                    </>
                )}
            </VStack>
        </Screen>
    );
};
