import { useCallback } from 'react';
import { useStore } from 'react-redux';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';

import {
    type NavigateToStakingDetail,
    useStakingDetailNavigation,
} from './useStakingDetailNavigation';
import { useStakingNavigateAnalytics } from './useStakingNavigateAnalytics';

export const useNavigateToStakingDetailWithAnalytics = () => {
    const { navigateToStakingDetail } = useStakingDetailNavigation();
    const reportStakingNavigate = useStakingNavigateAnalytics();
    const store = useStore<AccountsRootState>();

    return useCallback<NavigateToStakingDetail>(
        ({ accountKey, symbol }) => {
            const account = selectAccountByKey(store.getState(), accountKey);
            if (account) {
                reportStakingNavigate(account);
            }
            navigateToStakingDetail({ accountKey, symbol });
        },
        [navigateToStakingDetail, reportStakingNavigate, store],
    );
};
