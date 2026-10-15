import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled, isRejected } from '@reduxjs/toolkit';

import { selectIsMevProtectionFeatureEnabled } from '@suite-common/mev';
import {
    type AccountsRootState,
    type FormDraftRootState,
    selectAccountNetworkSymbol,
    selectFormDraft,
} from '@suite-common/wallet-core';
import { type AccountKey, type FormState } from '@suite-common/wallet-types';
import { getFormDraftKey } from '@suite-common/wallet-utils';
import { analytics } from '@suite-native/analytics';
import {
    type RootStackParamList,
    type RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import {
    pushSignedStakeTransactionThunk,
    signStakeTransactionThunk,
} from '../../thunks/staking/stakingThunks';
import { type EarnFormDraftPrefix } from '../../types';
import { reportTransactionCreated } from '../../utils/earn/earnAnalyticsUtils';
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

    const navigation = useNavigation<NavigationProps>();
    const handleReviewError = useHandleEarnReviewError(stakeType, navigation);
    const precomposedTransaction = useEarnSelectedPrecomposedTransaction(stakeType, accountKey);

    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const formState = useSelector((state: FormDraftRootState) =>
        selectFormDraft<FormState>(state, getFormDraftKey(stakeType, accountKey)),
    );

    const isMevProtectionFeatureEnabled = useSelector(selectIsMevProtectionFeatureEnabled);

    const { dispatch } = useServices(injectDispatch);

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
                formState: formState ?? { options: [] },
                txType: 'stake',
            });
        }

        const response = await dispatch(
            pushSignedStakeTransactionThunk({
                accountKey,
                stakeType,
                isMevProtectionFeatureEnabled,
            }),
        );

        if (isFulfilled(response)) {
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
        formState,
    ]);

    return { handleSign, handlePush, closeReview, markReviewNavigationSuccess };
};
