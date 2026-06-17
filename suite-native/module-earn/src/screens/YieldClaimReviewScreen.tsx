import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { selectSelectedDevice } from '@suite-common/device';
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
import { buildYieldReviewPreview } from '../utils/yieldReviewOutputUtils';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldClaimReview>;
type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.YieldClaimReview>;

export const YieldClaimReviewScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const { accountKey } = route.params;
    const device = useSelector(selectSelectedDevice);
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const flowKey = account?.key ?? null;
    const session = useSelector((state: StablecoinYieldRootState) =>
        selectStablecoinYieldSessionByFlowKey(state, 'claim', flowKey),
    );
    const review = session?.action.review?.type === 'claim' ? session.action.review : null;
    const preview = useMemo(() => {
        if (!account || !device || !review) {
            return null;
        }

        return buildYieldReviewPreview({
            account,
            device,
            review,
            type: 'claim',
        });
    }, [account, device, review]);

    useEffect(() => {
        if (!account) {
            return;
        }

        if (!review || session?.step !== 'action') {
            navigation.navigate(YieldStackRoutes.YieldClaim, route.params);
        }
    }, [account, navigation, review, route.params, session?.step]);

    if (!account || !preview || !review) {
        return null;
    }

    return <YieldClaimReviewContent account={account} flowKey={account.key} preview={preview} />;
};
