import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    type YieldStackParamList,
    YieldStackRoutes,
    stackNavigationOptionsConfig,
    useDisableIOSGesture,
} from '@suite-native/navigation';

import { HowYieldWorksScreen } from '../screens/HowYieldWorksScreen';
import { YieldConsentsScreen } from '../screens/YieldConsentsScreen';
import { YieldSupplyApprovalScreen } from '../screens/YieldSupplyApprovalScreen';
import { YieldSupplyApprovalTransactionDataReviewScreen } from '../screens/YieldSupplyApprovalTransactionDataReviewScreen';
import { YieldSupplyCompleteScreen } from '../screens/YieldSupplyCompleteScreen';
import { YieldSupplyReviewScreen } from '../screens/YieldSupplyReviewScreen';
import { YieldSupplyScreen } from '../screens/YieldSupplyScreen';

const YieldStack = createNativeStackNavigator<YieldStackParamList>();

export const YieldStackNavigator = () => {
    useDisableIOSGesture();

    return (
        <YieldStack.Navigator
            screenOptions={stackNavigationOptionsConfig}
            initialRouteName={YieldStackRoutes.HowYieldWorks}
        >
            <YieldStack.Screen
                options={{ title: YieldStackRoutes.HowYieldWorks }}
                name={YieldStackRoutes.HowYieldWorks}
                component={HowYieldWorksScreen}
            />
            <YieldStack.Screen
                options={{ title: YieldStackRoutes.YieldConsents }}
                name={YieldStackRoutes.YieldConsents}
                component={YieldConsentsScreen}
            />
            <YieldStack.Screen
                options={{ title: YieldStackRoutes.YieldSupplyApproval }}
                name={YieldStackRoutes.YieldSupplyApproval}
                component={YieldSupplyApprovalScreen}
            />
            <YieldStack.Screen
                options={{ title: YieldStackRoutes.YieldSupply }}
                name={YieldStackRoutes.YieldSupply}
                component={YieldSupplyScreen}
            />
            <YieldStack.Screen
                options={{ title: YieldStackRoutes.YieldSupplyApprovalReview }}
                name={YieldStackRoutes.YieldSupplyApprovalReview}
                component={YieldSupplyApprovalTransactionDataReviewScreen}
            />
            <YieldStack.Screen
                options={{ title: YieldStackRoutes.YieldSupplyReview }}
                name={YieldStackRoutes.YieldSupplyReview}
                component={YieldSupplyReviewScreen}
            />
            <YieldStack.Screen
                options={{ title: YieldStackRoutes.YieldSupplyComplete }}
                name={YieldStackRoutes.YieldSupplyComplete}
                component={YieldSupplyCompleteScreen}
            />
        </YieldStack.Navigator>
    );
};
