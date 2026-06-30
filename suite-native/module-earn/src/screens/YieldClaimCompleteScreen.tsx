import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import {
    type StablecoinYieldRootState,
    selectStablecoinYieldSessionByFlowKey,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';
import {
    type YieldStackParamList,
    type YieldStackRoutes,
    useInterceptNativeNavigation,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';

import { YieldCompleteScreenContent } from '../components/YieldCompleteScreenContent';
import { getYieldClaimCompleteRows } from '../components/YieldCompleteScreenPresets';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldClaimComplete>;

export const YieldClaimCompleteScreen = () => {
    const route = useRoute<RouteProps>();
    const dispatch = useDispatch();
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const { accountKey } = route.params;
    const session = useSelector((state: StablecoinYieldRootState) =>
        selectStablecoinYieldSessionByFlowKey(state, 'claim', accountKey),
    );

    const handleExit = useCallback(() => {
        navigateToInitialScreen();
        dispatch(stablecoinYieldActions.disposeSession({ flowType: 'claim', flowKey: accountKey }));
    }, [accountKey, dispatch, navigateToInitialScreen]);

    useInterceptNativeNavigation({ onPress: handleExit });

    useEffect(() => {
        if (!session) {
            navigateToInitialScreen();

            return;
        }
    }, [navigateToInitialScreen, session]);

    if (session?.step !== 'complete') {
        return null;
    }

    const rows = getYieldClaimCompleteRows(session.result.completedRewards);

    return (
        <YieldCompleteScreenContent
            buttonTranslationId="earn.yieldCompleteScreen.backToOverview"
            onButtonPress={handleExit}
            rows={rows}
            title={<Translation id="earn.yieldClaimCompleteScreen.title" />}
            subtitle={<Translation id="earn.yieldClaimCompleteScreen.subtitle" />}
        />
    );
};
