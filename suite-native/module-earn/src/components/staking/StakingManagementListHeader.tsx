import { Context } from '@suite-common/message-system';
import {
    isSupportedEthStakingNetworkSymbol,
    isSupportedSolStakingNetworkSymbol,
} from '@suite-common/staking';
import { type AccountsRootState, selectAdaAccountHasStaked } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { isStakingSymbol, parseAccountKey } from '@suite-common/wallet-utils';
import { Text, VStack } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { ContextMessage } from '@suite-native/message-system';
import { useSelector } from '@suite-native/staking';

import { CardanoDelegatedOutsideBanner } from './CardanoDelegatedOutsideBanner';
import { CardanoStakingInfoBanner } from './CardanoStakingInfoBanner';
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

    const hasAdaStaked = useSelector((state: AccountsRootState) =>
        selectAdaAccountHasStaked(state, accountKey),
    );

    const isSolanaStaking = isSupportedSolStakingNetworkSymbol(networkSymbol);
    const isCardanoStaking = networkSymbol === 'ada';

    const isStakeSectionShown = !isCardanoStaking || hasAdaStaked;

    const historyHeadingId: TxKeyPath = isSolanaStaking
        ? 'earn.stakingManagementScreen.rewardsList.title'
        : 'earn.stakingManagementScreen.stakingHistory';

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
                {isCardanoStaking && <CardanoStakingInfoBanner accountKey={accountKey} />}
                {isStakeSectionShown && (
                    <>
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
                        {isCardanoStaking && (
                            <CardanoDelegatedOutsideBanner accountKey={accountKey} />
                        )}
                    </>
                )}
            </VStack>
            <Text variant="headline-sm">
                <Translation id={historyHeadingId} />
            </Text>
        </VStack>
    );
};
