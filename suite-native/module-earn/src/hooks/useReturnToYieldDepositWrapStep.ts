import { useCallback } from 'react';
import { useDispatch, useStore } from 'react-redux';

import { StackActions, useNavigation } from '@react-navigation/native';

import {
    type StablecoinYieldRootState,
    selectStablecoinYieldSessionByFlowKey,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';
import {
    type StackNavigationProps,
    type YieldFlowParams,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';

type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldDepositApproval | YieldStackRoutes.YieldDeposit
>;

type UseReturnToYieldDepositWrapStepParams = {
    flowKey: string | null;
    routeParams: YieldFlowParams;
};

export const useReturnToYieldDepositWrapStep = ({
    flowKey,
    routeParams,
}: UseReturnToYieldDepositWrapStepParams) => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const store = useStore<StablecoinYieldRootState>();

    return useCallback(() => {
        if (!flowKey) {
            return;
        }

        dispatch(stablecoinYieldActions.returnToWrapStep({ flowType: 'deposit', flowKey }));

        // The reducer refuses to leave the current step while an approval or deposit operation is
        // in flight, so navigate only once it actually moved the session back.
        const session = selectStablecoinYieldSessionByFlowKey(store.getState(), 'deposit', flowKey);

        if (session?.step !== 'wrap') {
            return;
        }

        navigation.dispatch(StackActions.popTo(YieldStackRoutes.YieldDepositWrap, routeParams));
    }, [dispatch, flowKey, navigation, routeParams, store]);
};
