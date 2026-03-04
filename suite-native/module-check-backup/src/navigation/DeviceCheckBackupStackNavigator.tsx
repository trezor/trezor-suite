import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { selectDeviceModel } from '@suite-common/device';
import {
    DeviceConnectionGuardScreenWithCancel,
    useDeviceConnectionGuard,
} from '@suite-native/device-authorization';
import {
    DeviceCheckBackupStackParamList,
    DeviceCheckBackupStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';
import { DeviceModelInternal, models } from '@trezor/device-utils';

import { DeviceCheckBackupFailScreen } from '../screens/DeviceCheckBackupFailScreen';
import { DeviceCheckBackupRecapScreen } from '../screens/DeviceCheckBackupRecapScreen';
import { DeviceCheckBackupScreen } from '../screens/DeviceCheckBackupScreen';
import { DeviceCheckBackupSuccessScreen } from '../screens/DeviceCheckBackupSuccessScreen';
import { DeviceCheckBackupSupportScreen } from '../screens/DeviceCheckBackupSupportScreen';
import { DeviceCheckBackupTutorialScreen } from '../screens/DeviceCheckBackupTutorialScreen';
import { DeviceCheckBackupUnsupportedModelScreen } from '../screens/DeviceCheckBackupUnsupportedModelScreen';

const checkBackupUnsupportedDeviceModels: DeviceModelInternal[] = [DeviceModelInternal.T1B1];

const DeviceCheckBackupStack = createNativeStackNavigator<DeviceCheckBackupStackParamList>();

export const DeviceCheckBackupStackNavigator = () => {
    const { isDeviceConnectionGuardVisible } = useDeviceConnectionGuard();

    const deviceModel = useSelector(selectDeviceModel);
    const isUnsupportedDeviceModel =
        deviceModel && checkBackupUnsupportedDeviceModels.includes(deviceModel);

    return (
        <DeviceCheckBackupStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            {isUnsupportedDeviceModel && (
                <DeviceCheckBackupStack.Screen
                    name={DeviceCheckBackupStackRoutes.UnsupportedModel}
                    component={DeviceCheckBackupUnsupportedModelScreen}
                    initialParams={{ deviceModel: models[deviceModel].name }}
                />
            )}
            {isDeviceConnectionGuardVisible && (
                <DeviceCheckBackupStack.Screen
                    name={DeviceCheckBackupStackRoutes.DeviceConnectionGuard}
                    component={DeviceConnectionGuardScreenWithCancel}
                />
            )}
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
                name={DeviceCheckBackupStackRoutes.CheckBackupSupport}
                component={DeviceCheckBackupSupportScreen}
            />
            <DeviceCheckBackupStack.Screen
                name={DeviceCheckBackupStackRoutes.CheckBackupFail}
                component={DeviceCheckBackupFailScreen}
            />
        </DeviceCheckBackupStack.Navigator>
    );
};
