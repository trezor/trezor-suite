import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    type YieldStackParamList,
    YieldStackRoutes,
    stackNavigationOptionsConfig,
    useDisableIOSGesture,
} from '@suite-native/navigation';

import { HowYieldWorksScreen } from '../screens/HowYieldWorksScreen';
import { YieldClaimCompleteScreen } from '../screens/YieldClaimCompleteScreen';
import { YieldClaimReviewScreen } from '../screens/YieldClaimReviewScreen';
import { YieldClaimScreen } from '../screens/YieldClaimScreen';
import { YieldConsentsScreen } from '../screens/YieldConsentsScreen';
import { YieldDepositApprovalScreen } from '../screens/YieldDepositApprovalScreen';
import { YieldDepositApprovalTransactionDataReviewScreen } from '../screens/YieldDepositApprovalTransactionDataReviewScreen';
import { YieldDepositCompleteScreen } from '../screens/YieldDepositCompleteScreen';
import { YieldDepositReviewScreen } from '../screens/YieldDepositReviewScreen';
import { YieldDepositRevokeScreen } from '../screens/YieldDepositRevokeScreen';
import { YieldDepositScreen } from '../screens/YieldDepositScreen';
import { YieldDepositWrapReviewScreen } from '../screens/YieldDepositWrapReviewScreen';
import { YieldDepositWrapScreen } from '../screens/YieldDepositWrapScreen';
import { YieldWithdrawCompleteScreen } from '../screens/YieldWithdrawCompleteScreen';
import { YieldWithdrawReviewScreen } from '../screens/YieldWithdrawReviewScreen';
import { YieldWithdrawScreen } from '../screens/YieldWithdrawScreen';
import { YieldWithdrawUnwrapReviewScreen } from '../screens/YieldWithdrawUnwrapReviewScreen';
import { YieldWithdrawUnwrapScreen } from '../screens/YieldWithdrawUnwrapScreen';

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
                options={{ title: YieldStackRoutes.YieldClaim }}
                name={YieldStackRoutes.YieldClaim}
                component={YieldClaimScreen}
            />
            <YieldStack.Screen
                options={{ title: YieldStackRoutes.YieldClaimReview }}
                name={YieldStackRoutes.YieldClaimReview}
                component={YieldClaimReviewScreen}
            />
            <YieldStack.Screen
                options={{ title: YieldStackRoutes.YieldClaimComplete }}
                name={YieldStackRoutes.YieldClaimComplete}
                component={YieldClaimCompleteScreen}
            />
            <YieldStack.Screen
                options={{ title: YieldStackRoutes.YieldDepositWrap }}
                name={YieldStackRoutes.YieldDepositWrap}
                component={YieldDepositWrapScreen}
            />
            <YieldStack.Screen
                options={{ title: YieldStackRoutes.YieldDepositWrapReview }}
                name={YieldStackRoutes.YieldDepositWrapReview}
                component={YieldDepositWrapReviewScreen}
            />
            <YieldStack.Screen
                options={{ title: YieldStackRoutes.YieldDepositApproval }}
                name={YieldStackRoutes.YieldDepositApproval}
                component={YieldDepositApprovalScreen}
            />
            <YieldStack.Screen
                options={{ title: YieldStackRoutes.YieldDeposit }}
                name={YieldStackRoutes.YieldDeposit}
                component={YieldDepositScreen}
            />
            <YieldStack.Screen
                options={{ title: YieldStackRoutes.YieldDepositRevoke }}
                name={YieldStackRoutes.YieldDepositRevoke}
                component={YieldDepositRevokeScreen}
            />
            <YieldStack.Screen
                options={{ title: YieldStackRoutes.YieldWithdraw }}
                name={YieldStackRoutes.YieldWithdraw}
                component={YieldWithdrawScreen}
            />
            <YieldStack.Screen
                options={{ title: YieldStackRoutes.YieldDepositApprovalReview }}
                name={YieldStackRoutes.YieldDepositApprovalReview}
                component={YieldDepositApprovalTransactionDataReviewScreen}
            />
            <YieldStack.Screen
                options={{ title: YieldStackRoutes.YieldDepositRevokeReview }}
                name={YieldStackRoutes.YieldDepositRevokeReview}
                component={YieldDepositApprovalTransactionDataReviewScreen}
            />
            <YieldStack.Screen
                options={{ title: YieldStackRoutes.YieldDepositReview }}
                name={YieldStackRoutes.YieldDepositReview}
                component={YieldDepositReviewScreen}
            />
            <YieldStack.Screen
                options={{ title: YieldStackRoutes.YieldWithdrawReview }}
                name={YieldStackRoutes.YieldWithdrawReview}
                component={YieldWithdrawReviewScreen}
            />
            <YieldStack.Screen
                options={{ title: YieldStackRoutes.YieldDepositComplete }}
                name={YieldStackRoutes.YieldDepositComplete}
                component={YieldDepositCompleteScreen}
            />
            <YieldStack.Screen
                options={{ title: YieldStackRoutes.YieldWithdrawUnwrap }}
                name={YieldStackRoutes.YieldWithdrawUnwrap}
                component={YieldWithdrawUnwrapScreen}
            />
            <YieldStack.Screen
                options={{ title: YieldStackRoutes.YieldWithdrawUnwrapReview }}
                name={YieldStackRoutes.YieldWithdrawUnwrapReview}
                component={YieldWithdrawUnwrapReviewScreen}
            />
            <YieldStack.Screen
                options={{ title: YieldStackRoutes.YieldWithdrawComplete }}
                name={YieldStackRoutes.YieldWithdrawComplete}
                component={YieldWithdrawCompleteScreen}
            />
        </YieldStack.Navigator>
    );
};
