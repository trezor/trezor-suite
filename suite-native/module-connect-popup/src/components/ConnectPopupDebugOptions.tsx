import React, { useEffect } from 'react';

import * as Linking from 'expo-linking';

import { BottomSheet, Button } from '@suite-native/atoms';
import TrezorConnectDeeplink from '@trezor/connect-mobile';

type ConnectPopupDebugOptionsProps = React.PropsWithChildren<{
    showDebug: boolean;
    setShowDebug: (show: boolean) => void;
}>;

export const ConnectPopupDebugOptions = ({
    showDebug,
    setShowDebug,
    children,
}: ConnectPopupDebugOptionsProps) => {
    useEffect(() => {
        TrezorConnectDeeplink.init({
            manifest: {
                email: 'info@trezor.io',
                appUrl: '@suite-native/app',
            },
            deeplinkCallbackUrl: 'https://httpbin.org/get',
            deeplinkOpen: url => {
                Linking.openURL(url);
            },
        });
    }, []);

    return (
        <BottomSheet
            isVisible={showDebug}
            onClose={() => {
                setShowDebug(false);
            }}
        >
            {children}
            <Button
                onPress={() => {
                    TrezorConnectDeeplink.getAddress({
                        path: "m/49'/0'/0'/0/0",
                        coin: 'btc',
                    });
                }}
            >
                getAddress test
            </Button>
            <Button
                onPress={() => {
                    TrezorConnectDeeplink.signTransaction({
                        coin: 'btc',
                        inputs: [
                            {
                                address_n: [
                                    (44 | 0x80000000) >>> 0,
                                    (0 | 0x80000000) >>> 0,
                                    (0 | 0x80000000) >>> 0,
                                    0,
                                    5,
                                ],
                                prev_hash:
                                    '50f6f1209ca92d7359564be803cb2c932cde7d370f7cee50fd1fad6790f6206d',
                                prev_index: 1,
                                amount: '10000',
                            },
                        ],
                        outputs: [
                            {
                                address:
                                    'bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3',
                                amount: '10000',
                                script_type: 'PAYTOADDRESS',
                            },
                        ],
                        push: false,
                    });
                }}
            >
                signTransaction test
            </Button>
            <Button
                onPress={() => {
                    TrezorConnectDeeplink.signMessage({
                        path: "m/49'/0'/0'/0/0",
                        coin: 'btc',
                        message: 'test',
                    });
                }}
            >
                signMessage test
            </Button>
            <Button
                onPress={() => {
                    // @ts-expect-error
                    TrezorConnectDeeplink.signMessage({
                        path: 'blabla',
                        coin: 'blabla',
                    });
                }}
            >
                signMessage invalid test
            </Button>
        </BottomSheet>
    );
};
