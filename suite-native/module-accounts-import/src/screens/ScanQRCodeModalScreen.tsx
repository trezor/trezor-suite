import { QRCodeScanner } from '@suite-native/qr-code';
import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    Screen,
    ScreenSubHeader,
    StackProps,
} from '@suite-native/navigation';
import { networks, NetworkType } from '@suite-common/wallet-config';

export const networkTypeToTitleMap: Record<NetworkType, string> = {
    bitcoin: 'Scan public key (XPUB)',
    cardano: 'Scan public key (XPUB)',
    ethereum: 'Scan receive address',
    ripple: 'Scan receive address',
};

export const ScanQRCodeModalScreen = ({
    navigation,
    route,
}: StackProps<AccountsImportStackParamList, AccountsImportStackRoutes.XpubScanModal>) => {
    const { networkSymbol } = route.params;
    const handleBarCodeScanned = (data: string) => {
        navigation.navigate(AccountsImportStackRoutes.XpubScan, {
            qrCode: data,
            networkSymbol,
        });
    };
    const { networkType } = networks[networkSymbol];
    const screenTitle = networkTypeToTitleMap[networkType];

    return (
        <Screen subheader={<ScreenSubHeader content={screenTitle} />}>
            <QRCodeScanner onCodeScanned={handleBarCodeScanned} />
        </Screen>
    );
};
