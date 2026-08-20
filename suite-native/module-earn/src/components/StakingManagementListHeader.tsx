import { Context } from '@suite-common/message-system';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    isStakingSymbol,
    isSupportedEthStakingNetworkSymbol,
    isSupportedSolStakingNetworkSymbol,
    parseAccountKey,
} from '@suite-common/wallet-utils';
import { Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ContextMessage } from '@suite-native/message-system';

import { InstantUnstakeConfirmationBanner } from './InstantUnstakeConfirmationBanner';
import { SolExternalStakingBanner } from './SolExternalStakingBanner';
import { SolStakingRewardsWarning } from './SolStakingRewardsWarning';
import { StakingManagementPendingSection } from './StakingManagementPendingSection';
import { StakingManagementStakedCard } from './StakingManagementStakedCard';

type StakingManagementListHeaderProps = {
    accountKey: AccountKey;
};

export const StakingManagementListHeader = ({ accountKey }: StakingManagementListHeaderProps) => {
    const { networkSymbol } = parseAccountKey(accountKey);

    const isSolanaStaking = isSupportedSolStakingNetworkSymbol(networkSymbol);

    return (
        <VStack spacing="sp48" marginTop="sp32" paddingHorizontal="sp16">
            {isSupportedEthStakingNetworkSymbol(networkSymbol) && (
                <InstantUnstakeConfirmationBanner accountKey={accountKey} />
            )}
            {isStakingSymbol(networkSymbol) && (
                <ContextMessage context={Context.getStaking(networkSymbol)} />
            )}
            <StakingManagementPendingSection accountKey={accountKey} />
            {isSolanaStaking && <SolStakingRewardsWarning accountKey={accountKey} />}
            <VStack spacing="sp16">
                <Text variant="headline-sm">
                    <Translation id="earn.stakingManagementScreen.yourStake" />
                </Text>
                <StakingManagementStakedCard
                    accountKey={accountKey}
                    networkSymbol={networkSymbol}
                />
                {isSolanaStaking && (
                    <SolExternalStakingBanner
                        accountKey={accountKey}
                        networkSymbol={networkSymbol}
                    />
                )}
            </VStack>
            <Text variant="headline-sm">
                <Translation
                    id={
                        isSolanaStaking
                            ? 'earn.stakingManagementScreen.rewardsList.title'
                            : 'earn.stakingManagementScreen.stakingHistory'
                    }
                />
            </Text>
        </VStack>
    );
};
