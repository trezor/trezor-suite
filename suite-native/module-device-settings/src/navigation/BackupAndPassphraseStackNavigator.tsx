import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useDeviceConnectionGuard } from '@suite-native/device-authorization';
import {
    BackupAndPassphraseParamList,
    BackupAndPassphraseStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { BackupAndPassphraseScreen } from '../screens/BackupAndPassphrase/BackupAndPassphraseScreen';
import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';

const BackupAndPassphraseStack = createNativeStackNavigator<BackupAndPassphraseParamList>();

export const BackupAndPassphraseStackNavigator = () => {
    useDeviceConnectionGuard();

    return (
        <BackupAndPassphraseStack.Navigator
            initialRouteName={BackupAndPassphraseStackRoutes.BackupAndPassphrase}
            screenOptions={stackNavigationOptionsConfig}
        >
            <BackupAndPassphraseStack.Screen
                name={BackupAndPassphraseStackRoutes.BackupAndPassphrase}
                component={BackupAndPassphraseScreen}
            />
            <BackupAndPassphraseStack.Screen
                name={BackupAndPassphraseStackRoutes.ContinueOnTrezor}
                component={ContinueOnTrezorScreen}
            />
        </BackupAndPassphraseStack.Navigator>
    );
};
