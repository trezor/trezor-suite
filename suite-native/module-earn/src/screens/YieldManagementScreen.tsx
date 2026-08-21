import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import {
    type AccountsRootState,
    fetchAllTransactionsForAccountThunk,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { type RootStackParamList, type RootStackRoutes, Screen } from '@suite-native/navigation';
import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';
import { TransactionList } from '@suite-native/transactions';

import { YieldManagementScreenContent } from './YieldManagementScreenContent';
import { EarnPortfolioTrackerGuard } from '../components/EarnPortfolioTrackerGuard';
import { YieldManagementScreenHeader } from '../components/YieldManagementScreenHeader';

export const YieldManagementScreen = () => {
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.YieldManagement>>();
    const { accountKey, tokenContract } = route.params;
    const dispatch = useDispatch();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const yieldToken = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, accountKey, tokenContract),
    );

    useEffect(() => {
        dispatch(fetchAllTransactionsForAccountThunk({ accountKey, noLoading: true }));
    }, [accountKey, dispatch]);

    if (!account || !yieldToken) return null;

    return (
        <EarnPortfolioTrackerGuard>
            <Screen
                header={
                    <YieldManagementScreenHeader account={account} tokenContract={tokenContract} />
                }
                noHorizontalPadding
                noBottomPadding
                hasBottomInset={false}
                isScrollable={false}
            >
                <TransactionList
                    account={account}
                    listHeaderComponent={
                        <YieldManagementScreenContent account={account} yieldToken={yieldToken} />
                    }
                    filter="yield"
                />
            </Screen>
        </EarnPortfolioTrackerGuard>
    );
};
