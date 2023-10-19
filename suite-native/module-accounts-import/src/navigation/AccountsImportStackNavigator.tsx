import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { SelectNetworkScreen } from '../screens/SelectNetworkScreen';
import { XpubScanScreen } from '../screens/XpubScanScreen';
import { AccountImportLoadingScreen } from '../screens/AccountImportLoadingScreen';
import { AccountImportSummaryScreen } from '../screens/AccountImportSummaryScreen';
import { ScanQRCodeModalScreen } from '../screens/ScanQRCodeModalScreen';

export const AccountsImportStack = createNativeStackNavigator<AccountsImportStackParamList>();

export const AccountsImportStackNavigator = () => (
    <AccountsImportStack.Navigator screenOptions={stackNavigationOptionsConfig}>
        <AccountsImportStack.Group>
            <AccountsImportStack.Screen
                name={AccountsImportStackRoutes.SelectNetwork}
                component={SelectNetworkScreen}
            />
            <AccountsImportStack.Screen
                name={AccountsImportStackRoutes.XpubScan}
                component={XpubScanScreen}
            />
            <AccountsImportStack.Screen
                name={AccountsImportStackRoutes.AccountImportLoading}
                component={AccountImportLoadingScreen}
            />
            <AccountsImportStack.Screen
                name={AccountsImportStackRoutes.AccountImportSummary}
                component={AccountImportSummaryScreen}
            />
        </AccountsImportStack.Group>
        <AccountsImportStack.Group screenOptions={{ presentation: 'modal' }}>
            <AccountsImportStack.Screen
                name={AccountsImportStackRoutes.XpubScanModal}
                component={ScanQRCodeModalScreen}
            />
        </AccountsImportStack.Group>
    </AccountsImportStack.Navigator>
);
