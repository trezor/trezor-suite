import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    type AssetsStackParamList,
    AssetsStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { AssetDetailScreen } from '../screens/AssetDetailScreen';

const AssetsStack = createNativeStackNavigator<AssetsStackParamList>();

export const AssetsStackNavigator = () => (
    <AssetsStack.Navigator
        screenOptions={stackNavigationOptionsConfig}
        initialRouteName={AssetsStackRoutes.AssetDetail}
    >
        <AssetsStack.Screen name={AssetsStackRoutes.AssetDetail} component={AssetDetailScreen} />
    </AssetsStack.Navigator>
);
