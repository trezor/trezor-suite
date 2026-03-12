import { useMemo } from 'react';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { parseAccountKey } from '@suite-common/wallet-utils';
import { Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { type RootStackParamList, type RootStackRoutes, Screen } from '@suite-native/navigation';
import { TransactionList } from '@suite-native/transactions';

import { StakingManagementPendingSection } from '../components/StakingManagementPendingSection';
import { StakingManagementScreenHeader } from '../components/StakingManagementScreenHeader';
import { StakingManagementStakedCard } from '../components/StakingManagementStakedCard';

export const StakingManagementScreen = () => {
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.StakingManagement>>();
    const { accountKey } = route.params;
    const { networkSymbol } = parseAccountKey(accountKey);

    const listHeaderComponent = useMemo(
        () => (
            <VStack spacing={48} marginTop="sp32" paddingHorizontal="sp16">
                <StakingManagementPendingSection accountKey={accountKey} />
                <VStack spacing="sp16">
                    <Text variant="headline-sm">
                        <Translation id="earn.stakingManagementScreen.yourStake" />
                    </Text>
                    <StakingManagementStakedCard
                        accountKey={accountKey}
                        networkSymbol={networkSymbol}
                    />
                </VStack>
                <Text variant="headline-sm">
                    <Translation id="earn.stakingManagementScreen.stakingHistory" />
                </Text>
            </VStack>
        ),
        [accountKey, networkSymbol],
    );

    return (
        <Screen header={<StakingManagementScreenHeader />} noHorizontalPadding>
            <TransactionList
                accountKey={accountKey}
                listHeaderComponent={listHeaderComponent}
                stakingOnly
            />
        </Screen>
    );
};
