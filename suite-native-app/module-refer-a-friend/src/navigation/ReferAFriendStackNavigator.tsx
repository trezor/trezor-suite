import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    DeviceConnectionGuardScreen,
    useDeviceConnectionGuard,
} from '@suite-native/device-authorization';
import {
    type ReferAFriendStackParamList,
    ReferAFriendStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';

const ReferAFriendStack = createNativeStackNavigator<ReferAFriendStackParamList>();

export const ReferAFriendStackNavigator = () => {
    const { isDeviceConnectionGuardVisible } = useDeviceConnectionGuard();

    return (
        <ReferAFriendStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            {isDeviceConnectionGuardVisible && (
                <ReferAFriendStack.Screen
                    name={ReferAFriendStackRoutes.DeviceConnectionGuard}
                    component={DeviceConnectionGuardScreen}
                />
            )}
            <ReferAFriendStack.Screen
                name={ReferAFriendStackRoutes.ContinueOnTrezor}
                component={ContinueOnTrezorScreen}
            />
        </ReferAFriendStack.Navigator>
    );
};
