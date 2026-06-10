import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import {
    type AccountsRootState,
    type StablecoinYieldRootState,
    selectAccountByKey,
    selectStablecoinYieldSessionByFlowKey,
} from '@suite-common/wallet-core';
import {
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';

import { YieldClaimReviewContent } from '../components/YieldClaimReviewContent';
import { getYieldClaimUnsignedTransactionFee } from '../utils/yieldClaimFeeUtils';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldClaimReview>;
type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.YieldClaimReview>;

export const YieldClaimReviewScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const { accountKey } = route.params;
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const flowKey = account?.key ?? null;
    const session = useSelector((state: StablecoinYieldRootState) =>
        selectStablecoinYieldSessionByFlowKey(state, 'claim', flowKey),
    );
    const review = session?.action.review?.type === 'claim' ? session.action.review : null;
    const fee = useMemo(
        () => (review ? getYieldClaimUnsignedTransactionFee(review.unsignedTransaction) : null),
        [review],
    );

    useEffect(() => {
        if (!account) {
            return;
        }

        if (!review || session?.step !== 'action' || !fee) {
            navigation.navigate(YieldStackRoutes.YieldClaim, route.params);
        }
    }, [account, fee, navigation, review, route.params, session?.step]);

    if (!account || !review || !fee) {
        return null;
    }

    return (
        <YieldClaimReviewContent
            account={account}
            fee={fee}
            flowKey={account.key}
            review={review}
        />
    );
};
