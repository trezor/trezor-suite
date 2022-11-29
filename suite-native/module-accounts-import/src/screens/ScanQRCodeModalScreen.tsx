import React from 'react';

import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    Screen,
    ScreenHeader,
    StackProps,
} from '@suite-native/navigation';
import { QRCodeScanner } from '@suite-native/qr-code-scanner';

export const ScanQRCodeModalScreen = ({
    navigation,
}: StackProps<AccountsImportStackParamList, AccountsImportStackRoutes.XpubScanModal>) => {
    const handleBarCodeScanned = (data: string) => {
        navigation.navigate(AccountsImportStackRoutes.XpubScan, {
            qrCode: data,
        });
    };

    return (
        <Screen header={<ScreenHeader title="Scan QR" />}>
            <QRCodeScanner onCodeScanned={handleBarCodeScanned} />
        </Screen>
    );
};
