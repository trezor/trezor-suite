import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    type StellarManageTokenStackParamList,
    StellarManageTokenStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ActivationFeeScreen } from '../screens/ActivationFeeScreen';
import { DeactivationFeeScreen } from '../screens/DeactivationFeeScreen';
import { ManualTokenInputScreen } from '../screens/ManualTokenInputScreen';

const StellarManageTokenStack = createNativeStackNavigator<StellarManageTokenStackParamList>();

export const StellarManageTokenStackNavigator = () => (
    <StellarManageTokenStack.Navigator
        initialRouteName={StellarManageTokenStackRoutes.ManualTokenInput}
        screenOptions={stackNavigationOptionsConfig}
    >
        <StellarManageTokenStack.Screen
            name={StellarManageTokenStackRoutes.ManualTokenInput}
            component={ManualTokenInputScreen}
        />
        <StellarManageTokenStack.Screen
            name={StellarManageTokenStackRoutes.ActivationFee}
            component={ActivationFeeScreen}
        />
        <StellarManageTokenStack.Screen
            name={StellarManageTokenStackRoutes.DeactivationFee}
            component={DeactivationFeeScreen}
        />
    </StellarManageTokenStack.Navigator>
);
