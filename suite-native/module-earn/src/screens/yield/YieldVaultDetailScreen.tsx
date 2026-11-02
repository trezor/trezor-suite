import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type RootStackParamList, type RootStackRoutes, Screen } from '@suite-native/navigation';
import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';
import { TransactionList } from '@suite-native/transactions';

import { YieldVaultDetailScreenContent } from './YieldVaultDetailScreenContent';
import { EarnPortfolioTrackerGuard } from '../../components/earn/EarnPortfolioTrackerGuard';
import { YieldVaultDetailScreenHeader } from '../../components/yield/YieldVaultDetailScreenHeader';

export const YieldVaultDetailScreen = () => {
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.YieldVaultDetail>>();
    const { accountKey, tokenContract } = route.params;

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const yieldToken = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, accountKey, tokenContract),
    );

    const { refetch: refetchYieldOpportunities } = useAllYieldOpportunities();

    if (!account || !yieldToken) return null;

    return (
        <EarnPortfolioTrackerGuard>
            <Screen
                header={
                    <YieldVaultDetailScreenHeader account={account} tokenContract={tokenContract} />
                }
                noHorizontalPadding
                noBottomPadding
                hasBottomInset={false}
                isScrollable={false}
            >
                <TransactionList
                    account={account}
                    onRefresh={refetchYieldOpportunities}
                    listHeaderComponent={
                        <YieldVaultDetailScreenContent account={account} yieldToken={yieldToken} />
                    }
                    filter={{ type: 'yield', vaultContract: tokenContract }}
                />
            </Screen>
        </EarnPortfolioTrackerGuard>
    );
};
