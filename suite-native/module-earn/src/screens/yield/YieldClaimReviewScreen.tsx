import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { selectSelectedDevice } from '@suite-common/device';
import { useDispatch } from '@suite-common/redux-utils';
import {
    type AccountsRootState,
    type YieldRootState,
    selectAccountByKey,
    selectYieldSessionByFlowKey,
    yieldActions,
} from '@suite-common/wallet-core';
import {
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';

import { YieldClaimReviewContent } from '../../components/yield/YieldClaimReviewContent';
import { buildYieldReviewPreview } from '../../utils/yield/yieldReviewOutputUtils';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldClaimReview>;
type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.YieldClaimReview>;

export const YieldClaimReviewScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const dispatch = useDispatch();
    const { accountKey } = route.params;
    const device = useSelector(selectSelectedDevice);
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const flowKey = account?.key ?? null;
    const session = useSelector((state: YieldRootState) =>
        selectYieldSessionByFlowKey(state, 'claim', flowKey),
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
            navigation.popTo(YieldStackRoutes.YieldClaim, route.params);

            return;
        }

        if (!device || preview) {
            return;
        }

        // The preview could not be built from the stored review data, so
        // signing must not start; leave with the standard failure alert
        // instead of an empty screen.
        dispatch(
            yieldActions.setError({
                flowKey: account.key,
                flowType: 'claim',
                error: 'TR_EARN_YIELD_ERROR_CLAIM_REVIEW_MISMATCH',
            }),
        );
        navigation.popTo(YieldStackRoutes.YieldClaim, route.params);
    }, [account, device, dispatch, navigation, preview, review, route.params, session?.step]);

    if (!account || !preview || !review) {
        return null;
    }

    return <YieldClaimReviewContent account={account} flowKey={account.key} preview={preview} />;
};
