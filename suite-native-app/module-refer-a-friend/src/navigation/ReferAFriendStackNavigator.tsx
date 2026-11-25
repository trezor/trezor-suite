import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    type ReferAFriendStackParamList,
    ReferAFriendStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { JoinReferAFriendStackNavigator } from './JoinReferAFriendStackNavigator';
import { ReferAFriendScreen } from '../screens/ReferAFriendScreen';

const ReferAFriendStack = createNativeStackNavigator<ReferAFriendStackParamList>();

export const ReferAFriendStackNavigator = () => (
    <ReferAFriendStack.Navigator screenOptions={stackNavigationOptionsConfig}>
        <ReferAFriendStack.Screen
            name={ReferAFriendStackRoutes.ReferAFriend}
            component={ReferAFriendScreen}
        />
        <ReferAFriendStack.Screen
            name={ReferAFriendStackRoutes.JoinReferAFriendStack}
            component={JoinReferAFriendStackNavigator}
            options={{ animation: 'slide_from_bottom' }}
        />
    </ReferAFriendStack.Navigator>
);
