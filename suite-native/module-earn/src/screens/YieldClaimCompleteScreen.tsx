import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import {
    type AccountsRootState,
    type StablecoinYieldRootState,
    selectAccountNetworkSymbol,
    selectStablecoinYieldSessionByFlowKey,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
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
    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const handleExit = useCallback(() => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: 'claim-form',
                to: 'earn-dashboard',
                networkSymbol: networkSymbol ?? undefined,
            },
        });
        navigateToInitialScreen();
        dispatch(stablecoinYieldActions.disposeSession({ flowType: 'claim', flowKey: accountKey }));
    }, [accountKey, analytics, dispatch, navigateToInitialScreen, networkSymbol]);

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
