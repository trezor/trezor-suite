import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { CommonActions, StackActions, useNavigation } from '@react-navigation/native';

import { useDispatch } from '@suite-common/redux-utils';
import {
    type AccountsRootState,
    cancelSignSendFormTransactionThunk,
    selectAccountByKey,
    sendFormActions,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { AppTabsRoutes, RootStackRoutes, useDisableIOSGesture } from '@suite-native/navigation';
import {
    type TransactionReviewOutputsState,
    selectIsTransactionReviewInProgress,
    useShowReviewCancellationAlert,
} from '@suite-native/transaction-management';

import { type EarnFormDraftPrefix } from '../types';
import { resolveStakingHomeRoute } from '../utils/resolveStakingHomeRoute';

const CLOSE_FLOW_ACTION_TYPE = StackActions.popToTop().type;
const REVIEW_EXIT_ACTION_TYPES = ['GO_BACK', CLOSE_FLOW_ACTION_TYPE];

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

    useDisableIOSGesture();

    const isCancellationAlertVisibleRef = useRef(false);
    const isReviewNavigationSuccessRef = useRef(false);

    const markReviewNavigationSuccess = useCallback(() => {
        isReviewNavigationSuccessRef.current = true;
    }, []);

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

    useEffect(() => {
        const cleanup = () => {
            dispatch(cancelSignSendFormTransactionThunk());
        };

        const unsubscribe = navigation.addListener('beforeRemove', e => {
            if (isReviewNavigationSuccessRef.current) {
                dispatch(sendFormActions.discardTransaction());

                return;
            }

            const actionType = e.data.action.type;
            const isClosingWholeFlow = actionType === CLOSE_FLOW_ACTION_TYPE;
            const isLeavingReview = REVIEW_EXIT_ACTION_TYPES.includes(actionType);

            if (!isLeavingReview || !isTransactionReviewInProgress) {
                cleanup();

                // Redirect the close button to the staking home; let plain back/swipe proceed.
                if (isClosingWholeFlow) {
                    e.preventDefault();
                    unsubscribe();
                    navigateToStakingHome();
                }

                return;
            }

            e.preventDefault();

            if (isCancellationAlertVisibleRef.current) {
                return;
            }
            isCancellationAlertVisibleRef.current = true;

            showReviewCancellationAlert().then(({ wasReviewCanceled }) => {
                isCancellationAlertVisibleRef.current = false;

                if (wasReviewCanceled) {
                    cleanup();
                    unsubscribe();

                    if (isClosingWholeFlow) {
                        navigateToStakingHome();
                    } else {
                        navigation.dispatch(e.data.action);
                    }
                }
            });
        });

        return unsubscribe;
    }, [
        accountKey,
        navigation,
        isTransactionReviewInProgress,
        showReviewCancellationAlert,
        dispatch,
        formType,
        navigateToStakingHome,
    ]);

    const navigateBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const closeReview = useCallback(() => {
        navigation.dispatch(StackActions.popToTop());
    }, [navigation]);

    return { navigateBack, closeReview, markReviewNavigationSuccess };
};
