import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    DeviceCheckBackupStackParamList,
    DeviceCheckBackupStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { DeviceCheckBackupRecapScreen } from '../screens/DeviceCheckBackupRecapScreen';
import { DeviceCheckBackupScreen } from '../screens/DeviceCheckBackupScreen';
import { DeviceCheckBackupSuccessScreen } from '../screens/DeviceCheckBackupSuccessScreen';
import { DeviceCheckBackupTutorialScreen } from '../screens/DeviceCheckBackupTutorialScreen';

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
    </DeviceCheckBackupStack.Navigator>
);
