import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ConfirmFirmwareUpdateScreen } from '../screens/ConfirmFirmwareUpdateScreen';
import { ConnectAndUnlockDeviceScreen } from '../screens/ConnectAndUnlockDeviceScreen';
import { CreateOrRecoverCrossroadsScreen } from '../screens/CreateOrRecoverCrossroadsScreen';
import { CreatePinScreen } from '../screens/CreatePinScreen';
import { CreateWalletLoadingScreen } from '../screens/CreateWalletLoadingScreen';
import { DeviceAuthenticityScreen } from '../screens/DeviceAuthenticityScreen';
import { DeviceAuthenticitySuccessScreen } from '../screens/DeviceAuthenticitySuccessScreen';
import { DeviceTutorialScreen } from '../screens/DeviceTutorialScreen';
import { FirmwareInstallationScreen } from '../screens/FirmwareInstallationScreen';
import { RecoveryInstructionsScreen } from '../screens/RecoveryInstructionsScreen';
import { RecoveryUnsupportedScreen } from '../screens/RecoveryUnsupportedScreen';
import { SecurityCheckScreen } from '../screens/SecurityCheckScreen';
import { SuspiciousDeviceScreen } from '../screens/SuspiciousDeviceScreen';
import { UninitializedDeviceLandingScreen } from '../screens/UninitializedDeviceLandingScreen';
import { WalletBackupRecapScreen } from '../screens/WalletBackupRecapScreen';
import { WalletBackupTutorialScreen } from '../screens/WalletBackupTutorialScreen';
import { WalletCreatedSuccessScreen } from '../screens/WalletCreatedSuccessScreen';
import { WalletCreationScreen } from '../screens/WalletCreationScreen';
import { WalletRecoveryScreen } from '../screens/WalletRecoveryScreen';

export const DeviceOnboardingStack = createNativeStackNavigator<DeviceOnboardingStackParamList>();

export const DeviceOnboardingStackNavigator = () => (
    <DeviceOnboardingStack.Navigator
        initialRouteName={DeviceOnboardingStackRoutes.UninitializedDeviceLanding}
        screenOptions={stackNavigationOptionsConfig}
    >
        <DeviceOnboardingStack.Screen
            name={DeviceOnboardingStackRoutes.ConnectAndUnlockDevice}
            component={ConnectAndUnlockDeviceScreen}
            options={{
                gestureEnabled: false,
                animation: 'slide_from_bottom',
            }}
        />
        <DeviceOnboardingStack.Screen
            name={DeviceOnboardingStackRoutes.UninitializedDeviceLanding}
            component={UninitializedDeviceLandingScreen}
        />
        <DeviceOnboardingStack.Screen
            name={DeviceOnboardingStackRoutes.SuspiciousDevice}
            component={SuspiciousDeviceScreen}
        />
        <DeviceOnboardingStack.Screen
            name={DeviceOnboardingStackRoutes.SecurityCheck}
            component={SecurityCheckScreen}
        />
        <DeviceOnboardingStack.Screen
            name={DeviceOnboardingStackRoutes.FirmwareInstallation}
            component={FirmwareInstallationScreen}
        />
        <DeviceOnboardingStack.Screen
            name={DeviceOnboardingStackRoutes.ConfirmFirmwareUpdate}
            component={ConfirmFirmwareUpdateScreen}
        />
        <DeviceOnboardingStack.Screen
            name={DeviceOnboardingStackRoutes.DeviceAuthenticity}
            component={DeviceAuthenticityScreen}
        />
        <DeviceOnboardingStack.Screen
            name={DeviceOnboardingStackRoutes.DeviceAuthenticitySuccess}
            component={DeviceAuthenticitySuccessScreen}
        />
        <DeviceOnboardingStack.Screen
            name={DeviceOnboardingStackRoutes.DeviceTutorial}
            component={DeviceTutorialScreen}
        />
        <DeviceOnboardingStack.Screen
            name={DeviceOnboardingStackRoutes.CreateOrRecoverCrossroads}
            component={CreateOrRecoverCrossroadsScreen}
        />

        <DeviceOnboardingStack.Screen
            name={DeviceOnboardingStackRoutes.CreateWalletLoading}
            component={CreateWalletLoadingScreen}
        />
        <DeviceOnboardingStack.Screen
            name={DeviceOnboardingStackRoutes.WalletBackupTutorial}
            component={WalletBackupTutorialScreen}
        />

        <DeviceOnboardingStack.Screen
            name={DeviceOnboardingStackRoutes.WalletCreation}
            component={WalletCreationScreen}
            options={{
                animation: 'fade',
            }}
        />
        <DeviceOnboardingStack.Screen
            name={DeviceOnboardingStackRoutes.WalletCreatedSuccess}
            component={WalletCreatedSuccessScreen}
        />
        <DeviceOnboardingStack.Screen
            name={DeviceOnboardingStackRoutes.WalletBackupRecap}
            component={WalletBackupRecapScreen}
            options={{
                animation: 'fade',
            }}
        />
        <DeviceOnboardingStack.Screen
            name={DeviceOnboardingStackRoutes.RecoveryUnsupported}
            component={RecoveryUnsupportedScreen}
        />
        <DeviceOnboardingStack.Screen
            name={DeviceOnboardingStackRoutes.RecoveryInstructions}
            component={RecoveryInstructionsScreen}
        />
        <DeviceOnboardingStack.Screen
            name={DeviceOnboardingStackRoutes.WalletRecovery}
            component={WalletRecoveryScreen}
        />
        <DeviceOnboardingStack.Screen
            name={DeviceOnboardingStackRoutes.CreatePin}
            component={CreatePinScreen}
        />
    </DeviceOnboardingStack.Navigator>
);
