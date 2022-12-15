import React from 'react';

import { QRCodeScanner } from '@suite-native/qr-code';
import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    Screen,
    ScreenHeader,
    StackProps,
} from '@suite-native/navigation';

export const ScanQRCodeModalScreen = ({
    navigation,
    route,
}: StackProps<AccountsImportStackParamList, AccountsImportStackRoutes.XpubScanModal>) => {
    const handleBarCodeScanned = (data: string) => {
        navigation.navigate(AccountsImportStackRoutes.XpubScan, {
            qrCode: data,
            networkSymbol: route.params.networkSymbol,
        });
    };

    return (
        <Screen header={<ScreenHeader title="Scan QR" />}>
            <QRCodeScanner onCodeScanned={handleBarCodeScanned} />
        </Screen>
    );
};
