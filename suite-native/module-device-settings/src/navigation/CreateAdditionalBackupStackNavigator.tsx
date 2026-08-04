import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { selectIsAdditionalShamirBackupInProgress } from '@suite-native/backup';
import {
    DeviceConnectionGuardScreen,
    useDeviceConnectionGuard,
} from '@suite-native/device-authorization';
import {
    type CreateAdditionalBackupStackParamList,
    CreateAdditionalBackupStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { CreateAdditionalBackupDisclaimerScreen } from '../screens/CreateAdditionalBackupDisclaimerScreen';
import { CreateAdditionalBackupErrorScreen } from '../screens/CreateAdditionalBackupErrorScreen';
import { CreateAdditionalBackupFollowInstructionsScreen } from '../screens/CreateAdditionalBackupFollowInstructionsScreen';
import { CreateAdditionalBackupHowItWorksScreen } from '../screens/CreateAdditionalBackupHowItWorksScreen';
import { CreateAdditionalBackupRecapScreen } from '../screens/CreateAdditionalBackupRecapScreen';
import { CreateAdditionalBackupSuccessScreen } from '../screens/CreateAdditionalBackupSuccessScreen';

const CreateAdditionalBackupStack =
    createNativeStackNavigator<CreateAdditionalBackupStackParamList>();

export const CreateAdditionalBackupStackNavigator = () => {
    const { isDeviceConnectionGuardVisible } = useDeviceConnectionGuard();
    const isAlreadyInBackupMode = useSelector(selectIsAdditionalShamirBackupInProgress);

    return (
        <CreateAdditionalBackupStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            {isDeviceConnectionGuardVisible && (
                <CreateAdditionalBackupStack.Screen
                    name={CreateAdditionalBackupStackRoutes.DeviceConnectionGuard}
                    component={DeviceConnectionGuardScreen}
                />
            )}
            {!isAlreadyInBackupMode && (
                <>
                    <CreateAdditionalBackupStack.Screen
                        name={CreateAdditionalBackupStackRoutes.Disclaimer}
                        component={CreateAdditionalBackupDisclaimerScreen}
                    />
                    <CreateAdditionalBackupStack.Screen
                        name={CreateAdditionalBackupStackRoutes.HowItWorks}
                        component={CreateAdditionalBackupHowItWorksScreen}
                    />
                </>
            )}
            <CreateAdditionalBackupStack.Screen
                name={CreateAdditionalBackupStackRoutes.FollowInstructions}
                component={CreateAdditionalBackupFollowInstructionsScreen}
            />
            <CreateAdditionalBackupStack.Screen
                name={CreateAdditionalBackupStackRoutes.Success}
                component={CreateAdditionalBackupSuccessScreen}
            />
            <CreateAdditionalBackupStack.Screen
                name={CreateAdditionalBackupStackRoutes.Recap}
                component={CreateAdditionalBackupRecapScreen}
            />
            <CreateAdditionalBackupStack.Screen
                name={CreateAdditionalBackupStackRoutes.Error}
                component={CreateAdditionalBackupErrorScreen}
            />
        </CreateAdditionalBackupStack.Navigator>
    );
};
