import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    type WrappedNativeTokenStackParamList,
    WrappedNativeTokenStackRoutes,
    stackNavigationOptionsConfig,
    useDisableIOSGesture,
} from '@suite-native/navigation';

import { WrapNativeTokenCompleteScreen } from '../screens/WrapNativeTokenCompleteScreen';
import { WrapNativeTokenReviewScreen } from '../screens/WrapNativeTokenReviewScreen';
import { WrapNativeTokenScreen } from '../screens/WrapNativeTokenScreen';

const WrappedNativeTokenStack = createNativeStackNavigator<WrappedNativeTokenStackParamList>();

export const WrappedNativeTokenStackNavigator = () => {
    useDisableIOSGesture();

    return (
        <WrappedNativeTokenStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            <WrappedNativeTokenStack.Screen
                options={{ title: WrappedNativeTokenStackRoutes.WrapNativeToken }}
                name={WrappedNativeTokenStackRoutes.WrapNativeToken}
                component={WrapNativeTokenScreen}
            />
            <WrappedNativeTokenStack.Screen
                options={{ title: WrappedNativeTokenStackRoutes.WrapNativeTokenReview }}
                name={WrappedNativeTokenStackRoutes.WrapNativeTokenReview}
                component={WrapNativeTokenReviewScreen}
            />
            <WrappedNativeTokenStack.Screen
                options={{ title: WrappedNativeTokenStackRoutes.WrapNativeTokenComplete }}
                name={WrappedNativeTokenStackRoutes.WrapNativeTokenComplete}
                component={WrapNativeTokenCompleteScreen}
            />
        </WrappedNativeTokenStack.Navigator>
    );
};
