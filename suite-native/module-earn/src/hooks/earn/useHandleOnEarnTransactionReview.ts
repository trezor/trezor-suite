import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled, isRejected } from '@reduxjs/toolkit';

import { useServices } from '@suite-common/dependency-injection';
import { selectIsMevProtectionFeatureEnabled } from '@suite-common/mev';
import { selectDispatch } from '@suite-common/redux-utils';
import {
    type AccountsRootState,
    type FormDraftRootState,
    pushStakeTransactionThunk,
    selectAccountNetworkSymbol,
    selectFormDraft,
} from '@suite-common/wallet-core';
import { type AccountKey, type FormState } from '@suite-common/wallet-types';
import { getFormDraftKey } from '@suite-common/wallet-utils';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import {
    type RootStackParamList,
    type RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { useEarnReviewBackNavigation } from './useEarnReviewBackNavigation';
import { useEarnSelectedPrecomposedTransaction } from './useEarnSelectedPrecomposedTransaction';
import { useHandleEarnReviewError } from './useHandleEarnReviewError';
import { signStakeTransactionThunk } from '../../thunks/staking/stakingThunks';
import { type EarnFormDraftPrefix } from '../../types';
import { reportTransactionCreated } from '../../utils/earn/earnAnalyticsUtils';

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

    const navigation = useNavigation<NavigationProps>();
    const handleReviewError = useHandleEarnReviewError(stakeType, navigation);
    const precomposedTransaction = useEarnSelectedPrecomposedTransaction(stakeType, accountKey);
    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const selectedFee = useSelector(
        (state: FormDraftRootState) =>
            selectFormDraft<FormState>(state, getFormDraftKey(stakeType, accountKey))
                ?.selectedFee ?? 'normal',
    );
    const isMevProtectionFeatureEnabled = useSelector(selectIsMevProtectionFeatureEnabled);

    const { analytics, dispatch } = useServices(selectNativeAnalyticsDep, selectDispatch);

    const handleSign = useCallback(async (): Promise<boolean> => {
        if (!precomposedTransaction) return false;

        const response = await dispatch(
            signStakeTransactionThunk({
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
        if (networkSymbol && precomposedTransaction) {
            reportTransactionCreated({
                analytics,
                symbol: networkSymbol,
                precomposedTransaction,
                selectedFee,
                txType: 'stake',
            });
        }

        const response = await dispatch(
            pushStakeTransactionThunk({ accountKey, isMevProtectionFeatureEnabled }),
        );

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
    }, [
        accountKey,
        analytics,
        dispatch,
        handleReviewError,
        isMevProtectionFeatureEnabled,
        networkSymbol,
        precomposedTransaction,
        selectedFee,
        stakeType,
    ]);

    return { handleSign, handlePush, closeReview, markReviewNavigationSuccess };
};
