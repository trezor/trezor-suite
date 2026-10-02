import { useSelector } from 'react-redux';

import { type AccountsRootState, selectIsTestnetAccount } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { AccountDiscoveryFailedBanner } from '@suite-native/accounts';
import { Box, VStack } from '@suite-native/atoms';

import { AccountDetailActionButtons } from './AccountDetailActionButtons';
import { AccountDetailGraph } from './AccountDetailGraph';
import { YourPositionCard } from './YourPositionCard';

type AccountDetailSummaryContentProps = {
    account: Account;
};

export const AccountDetailSummaryContent = ({ account }: AccountDetailSummaryContentProps) => {
    const isTestnetAccount = useSelector((state: AccountsRootState) =>
        selectIsTestnetAccount(state, account.key),
    );

    return (
        <VStack spacing="sp24">
            <AccountDiscoveryFailedBanner accountKey={account.key} />
            <YourPositionCard account={account} token={null} />
            {!isTestnetAccount && (
                <AccountDetailGraph accountKey={account.key} areEventsEnabled={false} />
            )}
            <Box paddingTop="sp8" paddingHorizontal="sp16">
                <AccountDetailActionButtons accountKey={account.key} />
            </Box>
        </VStack>
    );
};
