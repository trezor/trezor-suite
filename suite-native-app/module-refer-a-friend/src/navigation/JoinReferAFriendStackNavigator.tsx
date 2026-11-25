import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    DeviceConnectionGuardScreen,
    useDeviceConnectionGuard,
} from '@suite-native/device-authorization';
import {
    type JoinReferAFriendStackParamList,
    JoinReferAFriendStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';

const JoinReferAFriendStack = createNativeStackNavigator<JoinReferAFriendStackParamList>();

export const JoinReferAFriendStackNavigator = () => {
    const { isDeviceConnectionGuardVisible } = useDeviceConnectionGuard();

    return (
        <JoinReferAFriendStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            {isDeviceConnectionGuardVisible && (
                <JoinReferAFriendStack.Screen
                    name={JoinReferAFriendStackRoutes.DeviceConnectionGuard}
                    component={DeviceConnectionGuardScreen}
                />
            )}
            <JoinReferAFriendStack.Screen
                name={JoinReferAFriendStackRoutes.ContinueOnTrezor}
                component={ContinueOnTrezorScreen}
            />
        </JoinReferAFriendStack.Navigator>
    );
};
