import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    type YieldStackParamList,
    YieldStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { HowYieldWorksScreen } from '../screens/HowYieldWorksScreen';
import { YieldConsentsScreen } from '../screens/YieldConsentsScreen';
import { YieldSupplyApprovalTransactionDataReviewScreen } from '../screens/YieldSupplyApprovalTransactionDataReviewScreen';
import { YieldSupplyFlowScreen } from '../screens/YieldSupplyFlowScreen';

const YieldStack = createNativeStackNavigator<YieldStackParamList>();

export const YieldStackNavigator = () => (
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
            options={{ title: YieldStackRoutes.YieldSupplyFlow }}
            name={YieldStackRoutes.YieldSupplyFlow}
            component={YieldSupplyFlowScreen}
        />
        <YieldStack.Screen
            options={{ title: YieldStackRoutes.YieldSupplyApprovalReview }}
            name={YieldStackRoutes.YieldSupplyApprovalReview}
            component={YieldSupplyApprovalTransactionDataReviewScreen}
        />
    </YieldStack.Navigator>
);
