import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { walletConnectPairThunk } from '@suite-common/walletconnect';
import {
    BottomSheet,
    Button,
    IconButton,
    Input,
    Text,
    TextDivider,
    VStack,
} from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { ScanQRBottomSheet } from '@suite-native/qr-code';

export type WalletConnectPairBottomSheetProps = {
    pairingOpened: 'qr' | 'manual' | null;
    setPairingOpened: (value: 'qr' | 'manual' | null) => void;
};

export const WalletConnectPairBottomSheet = ({
    pairingOpened,
    setPairingOpened,
}: WalletConnectPairBottomSheetProps) => {
    const dispatch = useDispatch();
    const { translate } = useTranslate();

    const [uri, setUri] = useState('');
    const [isPairing, setIsPairing] = useState(false);

    const handlePair = (currentUri: string) => {
        setIsPairing(true);
        dispatch(walletConnectPairThunk({ uri: currentUri })).finally(() => {
            setPairingOpened(null);
            setIsPairing(false);
            setUri('');
        });
    };
    const handleClose = () => {
        setPairingOpened(null);
        setUri('');
    };

    // Special handling is needed to allow both bottom sheets to coexist
    // Visibility state is split and controlled separately for each bottom sheet, with a delay
    const lastPairingOpened = useRef<'qr' | 'manual' | null>(null);
    const [qrVisible, setQrVisible] = useState(false);
    const [manualVisible, setManualVisible] = useState(false);
    useEffect(() => {
        let timeoutId: NodeJS.Timeout | null = null;
        if (pairingOpened === 'manual' && lastPairingOpened.current === 'qr') {
            setQrVisible(false);
            timeoutId = setTimeout(() => setManualVisible(true), 100);
        } else if (pairingOpened === 'qr' && lastPairingOpened.current === 'manual') {
            setManualVisible(false);
            timeoutId = setTimeout(() => setQrVisible(true), 100);
        } else if (pairingOpened !== lastPairingOpened.current) {
            setQrVisible(pairingOpened === 'qr');
            setManualVisible(pairingOpened === 'manual');
        }
        lastPairingOpened.current = pairingOpened;

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [pairingOpened]);

    return (
        <>
            <ScanQRBottomSheet
                title={<Translation id="moduleConnectPopup.walletConnect.scanQR" />}
                isVisible={qrVisible}
                onCodeScanned={code => handlePair(code)}
                onClose={handleClose}
                spacing="sp16"
            >
                <TextDivider />
                <Button colorScheme="tertiaryElevation0" onPress={() => setPairingOpened('manual')}>
                    <Translation id="moduleConnectPopup.walletConnect.provideConnectionString" />
                </Button>
            </ScanQRBottomSheet>
            <BottomSheet
                isVisible={manualVisible}
                onClose={handleClose}
                title={<Translation id="moduleConnectPopup.walletConnect.addConnection" />}
            >
                <VStack spacing="sp16">
                    <Text color="textSubdued">
                        <Translation id="moduleConnectPopup.walletConnect.provideConnectionStringDescription" />
                    </Text>
                    <Input
                        value={uri}
                        onChangeText={setUri}
                        placeholder={translate(
                            'moduleConnectPopup.walletConnect.connectionStringPlaceholder',
                        )}
                        rightIcon={
                            <IconButton
                                iconName="qrCode"
                                onPress={() => setPairingOpened('qr')}
                                colorScheme="tertiaryElevation0"
                                isDisabled={isPairing}
                            />
                        }
                        editable={!isPairing}
                    />
                    <Button colorScheme="primary" onPress={() => handlePair(uri)} isDisabled={!uri}>
                        <Translation id="moduleConnectPopup.walletConnect.connect" />
                    </Button>
                </VStack>
            </BottomSheet>
        </>
    );
};
