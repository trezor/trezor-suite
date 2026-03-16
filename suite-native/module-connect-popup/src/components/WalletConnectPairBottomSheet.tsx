import { useState } from 'react';
import { useDispatch } from 'react-redux';

import * as Clipboard from 'expo-clipboard';

import { walletConnectPairThunk } from '@suite-common/walletconnect';
import { type BottomSheetModalRef, Button, Loader, TextDivider } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ScanQRBottomSheet } from '@suite-native/qr-code';
import { useToast } from '@suite-native/toasts';

export type WalletConnectPairBottomSheetProps = {
    onClose: () => void;
    ref: BottomSheetModalRef;
};

export const WalletConnectPairBottomSheet = ({
    ref,
    onClose,
}: WalletConnectPairBottomSheetProps) => {
    const dispatch = useDispatch();

    const { showToast } = useToast();
    const [isPairing, setIsPairing] = useState(false);

    const handlePair = (currentUri: string) => {
        setIsPairing(true);
        dispatch(walletConnectPairThunk({ uri: currentUri }))
            .unwrap()
            .catch(error => {
                showToast({
                    variant: 'warning',
                    message: error.message,
                });
            })
            .finally(() => {
                onClose();
                setIsPairing(false);
            });
    };
    const handleClose = () => {
        onClose();
    };
    const handlePaste = () => {
        Clipboard.getStringAsync().then(pastedUri => {
            handlePair(pastedUri);
        });
    };

    return (
        <ScanQRBottomSheet
            title={<Translation id="moduleConnectPopup.walletConnect.scanQR" />}
            onCodeScanned={code => handlePair(code)}
            onClose={handleClose}
            spacing="sp16"
            ref={ref}
        >
            <TextDivider />
            {isPairing ? (
                <Loader />
            ) : (
                <Button
                    intent="neutral"
                    priority="secondary"
                    onPress={handlePaste}
                    iconLeft="clipboard"
                >
                    <Translation id="moduleConnectPopup.walletConnect.pasteFromClipboard" />
                </Button>
            )}
        </ScanQRBottomSheet>
    );
};
