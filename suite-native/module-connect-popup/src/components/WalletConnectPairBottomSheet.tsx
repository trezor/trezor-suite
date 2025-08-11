import { useState } from 'react';
import { useDispatch } from 'react-redux';

import * as Clipboard from 'expo-clipboard';

import { walletConnectPairThunk } from '@suite-common/walletconnect';
import { Button, Loader, TextDivider } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ScanQRBottomSheet } from '@suite-native/qr-code';
import { useToast } from '@suite-native/toasts';

export type WalletConnectPairBottomSheetProps = {
    pairingOpened: boolean;
    setPairingOpened: (value: boolean) => void;
};

export const WalletConnectPairBottomSheet = ({
    pairingOpened,
    setPairingOpened,
}: WalletConnectPairBottomSheetProps) => {
    const dispatch = useDispatch();

    const { showToast } = useToast();
    const [isPairing, setIsPairing] = useState(false);

    const handlePair = (currentUri: string) => {
        setIsPairing(true);
        dispatch(walletConnectPairThunk({ uri: currentUri }))
            .unwrap()
            .then(() => {
                showToast({
                    variant: 'success',
                    message: <Translation id="moduleConnectPopup.walletConnect.pairingSuccess" />,
                });
            })
            .catch(error => {
                showToast({
                    variant: 'warning',
                    message: error.message,
                });
            })
            .finally(() => {
                setPairingOpened(false);
                setIsPairing(false);
            });
    };
    const handleClose = () => {
        setPairingOpened(false);
    };
    const handlePaste = () => {
        Clipboard.getStringAsync().then(pastedUri => {
            handlePair(pastedUri);
        });
    };

    return (
        <ScanQRBottomSheet
            title={<Translation id="moduleConnectPopup.walletConnect.scanQR" />}
            isVisible={pairingOpened}
            onCodeScanned={code => handlePair(code)}
            onClose={handleClose}
            spacing="sp16"
        >
            <TextDivider />
            {isPairing ? (
                <Loader />
            ) : (
                <Button colorScheme="tertiaryElevation0" onPress={handlePaste} viewLeft="clipboard">
                    <Translation id="moduleConnectPopup.walletConnect.pasteFromClipboard" />
                </Button>
            )}
        </ScanQRBottomSheet>
    );
};
