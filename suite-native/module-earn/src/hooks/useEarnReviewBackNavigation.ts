import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { CommonActions, StackActions, useNavigation } from '@react-navigation/native';

import {
    type AccountsRootState,
    cancelSignSendFormTransactionThunk,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    AppTabsRoutes,
    type NavigationActionType,
    RootStackRoutes,
    useNavigationRemoveActionInterceptor,
} from '@suite-native/navigation';
import {
    type TransactionReviewOutputsState,
    selectIsTransactionReviewInProgress,
    useShowReviewCancellationAlert,
} from '@suite-native/transaction-management';

import { type EarnFormDraftPrefix } from '../types';
import { resolveStakingHomeRoute } from '../utils/resolveStakingHomeRoute';

const CLOSE_FLOW_ACTION_TYPE = StackActions.popToTop().type;
const REVIEW_EXIT_ACTION_TYPES = [
    'GO_BACK',
    'POP',
    CLOSE_FLOW_ACTION_TYPE,
] as NavigationActionType[];

export const useEarnReviewBackNavigation = (
    formType: EarnFormDraftPrefix,
    accountKey: AccountKey,
) => {
    const isTransactionReviewInProgress = useSelector((state: TransactionReviewOutputsState) =>
        selectIsTransactionReviewInProgress(state, formType, accountKey),
    );
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const dispatch = useDispatch();
    const navigation = useNavigation();
    const showReviewCancellationAlert = useShowReviewCancellationAlert();

    const isCancellationAlertVisibleRef = useRef(false);

    const navigateToStakingHome = useCallback(() => {
        if (!account) {
            navigation.dispatch(StackActions.popToTop());

            return;
        }

        const { name, params } = resolveStakingHomeRoute(account);

        navigation.dispatch(
            CommonActions.reset({
                index: 1,
                routes: [
                    {
                        name: RootStackRoutes.AppTabs,
                        params: { screen: AppTabsRoutes.EarnStack },
                    },
                    { name, params },
                ],
            }),
        );
    }, [account, navigation]);

    const cleanupReview = useCallback(() => {
        dispatch(cancelSignSendFormTransactionThunk());
    }, [dispatch]);

    useNavigationRemoveActionInterceptor({
        actionTypesToIntercept: isTransactionReviewInProgress
            ? REVIEW_EXIT_ACTION_TYPES
            : [CLOSE_FLOW_ACTION_TYPE],
        onInterceptedAction: action => {
            const isClosingWholeFlow = action.type === CLOSE_FLOW_ACTION_TYPE;

            if (!isTransactionReviewInProgress) {
                cleanupReview();
                navigateToStakingHome();

                return;
            }

            if (isCancellationAlertVisibleRef.current) {
                return;
            }
            isCancellationAlertVisibleRef.current = true;

            showReviewCancellationAlert().then(({ wasReviewCanceled }) => {
                isCancellationAlertVisibleRef.current = false;

                if (wasReviewCanceled) {
                    cleanupReview();

                    if (isClosingWholeFlow) {
                        navigateToStakingHome();
                    } else {
                        navigation.dispatch(action);
                    }
                }
            });
        },
        onPassThroughAction: cleanupReview,
    });

    const navigateBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const closeReview = useCallback(() => {
        navigation.dispatch(StackActions.popToTop());
    }, [navigation]);

    return { navigateBack, closeReview };
};
