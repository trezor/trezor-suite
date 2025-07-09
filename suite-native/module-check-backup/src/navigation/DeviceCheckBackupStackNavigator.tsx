import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    DeviceCheckBackupStackParamList,
    DeviceCheckBackupStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { DeviceCheckBackupFailScreen } from '../screens/DeviceCheckBackupFailScreen';
import { DeviceCheckBackupRecapScreen } from '../screens/DeviceCheckBackupRecapScreen';
import { DeviceCheckBackupScreen } from '../screens/DeviceCheckBackupScreen';
import { DeviceCheckBackupSuccessScreen } from '../screens/DeviceCheckBackupSuccessScreen';
import { DeviceCheckBackupSupportScreen } from '../screens/DeviceCheckBackupSupportScreen';
import { DeviceCheckBackupTutorialScreen } from '../screens/DeviceCheckBackupTutorialScreen';
import { DeviceCheckBackupUnsupportedModelScreen } from '../screens/DeviceCheckBackupUnsupportedModelScreen';

const DeviceCheckBackupStack = createNativeStackNavigator<DeviceCheckBackupStackParamList>();

export const DeviceCheckBackupStackNavigator = () => (
    <DeviceCheckBackupStack.Navigator
        initialRouteName={DeviceCheckBackupStackRoutes.CheckBackupTutorial}
        screenOptions={stackNavigationOptionsConfig}
    >
        <DeviceCheckBackupStack.Screen
            name={DeviceCheckBackupStackRoutes.CheckBackupTutorial}
            component={DeviceCheckBackupTutorialScreen}
        />
        <DeviceCheckBackupStack.Screen
            name={DeviceCheckBackupStackRoutes.CheckBackup}
            component={DeviceCheckBackupScreen}
        />
        <DeviceCheckBackupStack.Screen
            name={DeviceCheckBackupStackRoutes.CheckBackupSuccess}
            component={DeviceCheckBackupSuccessScreen}
        />
        <DeviceCheckBackupStack.Screen
            name={DeviceCheckBackupStackRoutes.CheckBackupRecap}
            component={DeviceCheckBackupRecapScreen}
        />
        <DeviceCheckBackupStack.Screen
            name={DeviceCheckBackupStackRoutes.UnsupportedModel}
            component={DeviceCheckBackupUnsupportedModelScreen}
        />

        <DeviceCheckBackupStack.Screen
            name={DeviceCheckBackupStackRoutes.CheckBackupSupport}
            component={DeviceCheckBackupSupportScreen}
        />
        <DeviceCheckBackupStack.Screen
            name={DeviceCheckBackupStackRoutes.CheckBackupFail}
            component={DeviceCheckBackupFailScreen}
        />
    </DeviceCheckBackupStack.Navigator>
);
