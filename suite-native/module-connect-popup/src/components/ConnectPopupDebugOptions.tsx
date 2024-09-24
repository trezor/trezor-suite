import React from 'react';
import { ScrollView } from 'react-native';

import * as Linking from 'expo-linking';

import { BottomSheet, Button } from '@suite-native/atoms';

import { buildURL } from '@trezor/connect-deeplink';

type ConnectPopupDebugOptionsProps = React.PropsWithChildren<{
    showDebug: boolean;
    setShowDebug: (show: boolean) => void;
}>;

export const ConnectPopupDebugOptions = ({
    showDebug,
    setShowDebug,
    children,
}: ConnectPopupDebugOptionsProps) => {
    return (
        <BottomSheet
            isVisible={showDebug}
            onClose={() => {
                setShowDebug(false);
            }}
        >
            <ScrollView>
                {children}
                <Button
                    onPress={() => {
                        Linking.openURL(
                            buildURL(
                                'getAddress',
                                {
                                    path: "m/49'/0'/0'/0/0",
                                    coin: 'btc',
                                },
                                'https://httpbin.org/get',
                            ),
                        );
                    }}
                >
                    getAddress test
                </Button>
                <Button
                    onPress={() => {
                        Linking.openURL(
                            buildURL(
                                'signTransaction',
                                {
                                    path: "m/49'/0'/0'/0/0",
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
                                },
                                'https://httpbin.org/get',
                            ),
                        );
                    }}
                >
                    signTransaction test
                </Button>
                <Button
                    onPress={() => {
                        Linking.openURL(
                            buildURL(
                                'signMessage',
                                {
                                    path: "m/49'/0'/0'/0/0",
                                    coin: 'btc',
                                    message: 'test',
                                },
                                'https://httpbin.org/get',
                            ),
                        );
                    }}
                >
                    signMessage test
                </Button>
                <Button
                    onPress={() => {
                        Linking.openURL(
                            buildURL(
                                'signMessage',
                                {
                                    path: 'blabla',
                                    coin: 'blabla',
                                },
                                'https://httpbin.org/get',
                            ),
                        );
                    }}
                >
                    signMessage invalid test
                </Button>
            </ScrollView>
        </BottomSheet>
    );
};
