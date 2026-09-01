import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled, isRejected } from '@reduxjs/toolkit';

import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import {
    type RootStackParamList,
    type RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import {
    pushStakeTransactionNativeThunk,
    signStakeTransactionNativeThunk,
} from '@suite-native/staking';

import { type EarnFormDraftPrefix } from '../types';
import { useEarnReviewBackNavigation } from './useEarnReviewBackNavigation';
import { useEarnSelectedPrecomposedTransaction } from './useEarnSelectedPrecomposedTransaction';
import { useHandleEarnReviewError } from './useHandleEarnReviewError';

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes>;

type HandleOnEarnTransactionReviewProps = {
    accountKey: AccountKey;
    stakeType: EarnFormDraftPrefix;
};

export const useHandleOnEarnTransactionReview = ({
    accountKey,
    stakeType,
}: HandleOnEarnTransactionReviewProps) => {
    const { closeReview, markReviewNavigationSuccess } = useEarnReviewBackNavigation(
        stakeType,
        accountKey,
    );

    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const handleReviewError = useHandleEarnReviewError(stakeType, navigation);
    const precomposedTransaction = useEarnSelectedPrecomposedTransaction(stakeType, accountKey);
    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const { analytics } = useServices(selectNativeAnalyticsDep);

    const handleSign = useCallback(async (): Promise<boolean> => {
        if (!precomposedTransaction) return false;

        const response = await dispatch(
            signStakeTransactionNativeThunk({
                accountKey,
                stakeType,
                precomposedTransaction,
            }),
        );

        if (!isRejected(response)) {
            return true;
        }

        handleReviewError(response.payload);

        return false;
    }, [accountKey, dispatch, handleReviewError, precomposedTransaction, stakeType]);

    const handlePush = useCallback(async (): Promise<string | undefined> => {
        const response = await dispatch(pushStakeTransactionNativeThunk({ accountKey }));

        if (isFulfilled(response)) {
            analytics.report({
                type: events.stakingConfirmEvent.name,
                payload: {
                    action: stakeType,
                    networkSymbol: networkSymbol ?? undefined,
                },
            });

            return response.payload.txid;
        }

        if (isRejected(response)) {
            handleReviewError(response.payload);
        }

        return undefined;
    }, [accountKey, analytics, dispatch, handleReviewError, networkSymbol, stakeType]);

    return { handleSign, handlePush, closeReview, markReviewNavigationSuccess };
};
