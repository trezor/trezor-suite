import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    type ForgetDeviceStackParamList,
    ForgetDeviceStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';
import { ForgetDeviceFinishScreen } from '../screens/ForgetDeviceFinishScreen';
import { ForgetDeviceGuideScreen } from '../screens/ForgetDeviceGuideScreen';

const ForgetDeviceStack = createNativeStackNavigator<ForgetDeviceStackParamList>();

export const ForgetDeviceStackNavigator = () => (
    <ForgetDeviceStack.Navigator screenOptions={stackNavigationOptionsConfig}>
        <ForgetDeviceStack.Screen
            name={ForgetDeviceStackRoutes.ForgetDeviceConfirmation}
            component={ContinueOnTrezorScreen}
        />
        <ForgetDeviceStack.Screen
            name={ForgetDeviceStackRoutes.ForgetDeviceGuide}
            component={ForgetDeviceGuideScreen}
        />
        <ForgetDeviceStack.Screen
            name={ForgetDeviceStackRoutes.ForgetDeviceFinish}
            component={ForgetDeviceFinishScreen}
        />
    </ForgetDeviceStack.Navigator>
);
