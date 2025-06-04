import { useDispatch, useSelector } from 'react-redux';

import { selectSessions, walletConnectDisconnectThunk } from '@suite-common/walletconnect';
import { Button, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';

export const WalletConnectPairScreen = () => {
    const dispatch = useDispatch();
    const sessions = useSelector(selectSessions);

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
                />
            }
        >
            <VStack spacing="sp24">
                <Text variant="highlight">
                    <Translation id="moduleConnectPopup.walletConnect.activeConnections" />:
                </Text>
                {sessions.map(session => (
                    <HStack key={session.topic} spacing="sp12">
                        <VStack flex={1} spacing="sp1">
                            <Text>{session.peer.metadata.name}</Text>
                            <Text color="textSubdued">{session.peer.metadata.url}</Text>
                            <Text color="textSubdued" numberOfLines={1}>
                                {session.topic}
                            </Text>
                        </VStack>
                        <VStack>
                            <Button
                                onPress={() => {
                                    dispatch(
                                        walletConnectDisconnectThunk({ topic: session.topic }),
                                    );
                                }}
                                size="small"
                                colorScheme="redElevation0"
                            >
                                <Translation id="moduleConnectPopup.walletConnect.disconnect" />
                            </Button>
                        </VStack>
                    </HStack>
                ))}
                {sessions.length === 0 && (
                    <Text>
                        <Translation id="moduleConnectPopup.walletConnect.noActiveConnections" />
                    </Text>
                )}
            </VStack>
        </Screen>
    );
};
