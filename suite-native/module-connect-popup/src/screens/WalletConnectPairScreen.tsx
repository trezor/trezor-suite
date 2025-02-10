import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    selectSessions,
    walletConnectDisconnectThunk,
    walletConnectPairThunk,
} from '@suite-common/walletconnect';
import { Button, Divider, HStack, IconButton, Input, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';
import { ScanQRBottomSheet } from '@suite-native/qr-code';

export const WalletConnectPairScreen = () => {
    const dispatch = useDispatch();
    const sessions = useSelector(selectSessions);

    const [uri, setUri] = useState('');
    const [qrVisible, setQrVisible] = useState(false);
    const [isPairing, setIsPairing] = useState(false);

    const handlePair = () => {
        setIsPairing(true);
        dispatch(walletConnectPairThunk({ uri })).finally(() => {
            setIsPairing(false);
            setUri('');
        });
    };
    const handleQr = () => {
        setQrVisible(true);
    };

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
                <VStack>
                    <Input
                        value={uri}
                        onChangeText={setUri}
                        placeholder="Connection URL..."
                        rightIcon={
                            <IconButton
                                iconName="qrCode"
                                onPress={handleQr}
                                colorScheme="tertiaryElevation0"
                                isDisabled={isPairing}
                            />
                        }
                        editable={!isPairing}
                    />
                    <Button colorScheme="primary" onPress={handlePair} isDisabled={!uri}>
                        <Translation id="moduleConnectPopup.walletConnect.connect" />
                    </Button>
                </VStack>

                <Divider />

                <VStack>
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
            </VStack>

            <ScanQRBottomSheet
                title={<Translation id="moduleConnectPopup.walletConnect.title" />}
                isVisible={qrVisible}
                onCodeScanned={setUri}
                onClose={() => setQrVisible(false)}
            />
        </Screen>
    );
};
