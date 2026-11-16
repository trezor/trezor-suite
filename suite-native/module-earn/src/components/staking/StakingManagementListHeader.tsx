import { useSelector } from 'react-redux';

import { type StakingRootState, selectIsStakingAccountActive } from '@suite-common/earn-staking';
import { Context } from '@suite-common/message-system';
import { getNetworkType } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { isStakingSymbol, parseAccountKey } from '@suite-common/wallet-utils';
import { Text, VStack } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { ContextMessage } from '@suite-native/message-system';

import { CardanoDelegatedOutsideBanner } from './CardanoDelegatedOutsideBanner';
import { CardanoStakingInfoBanner } from './CardanoStakingInfoBanner';
import { InstantUnstakeConfirmationBanner } from './InstantUnstakeConfirmationBanner';
import { SolExternalStakingBanner } from './SolExternalStakingBanner';
import { SolStakingRewardsWarning } from './SolStakingRewardsWarning';
import { StakingManagementPendingSection } from './StakingManagementPendingSection';
import { StakingManagementStakedCard } from './StakingManagementStakedCard';
import { TronResourcesCard } from './TronResourcesCard';
import { TronStakingPendingSection } from './TronStakingPendingSection';

type StakingManagementListHeaderProps = {
    accountKey: AccountKey;
};

export const StakingManagementListHeader = ({ accountKey }: StakingManagementListHeaderProps) => {
    const { networkSymbol } = parseAccountKey(accountKey);
    const networkType = getNetworkType(networkSymbol);

    const isStakingActive = useSelector((state: StakingRootState) =>
        selectIsStakingAccountActive(state, accountKey),
    );

    const isEthereumStaking = networkType === 'ethereum';
    const isSolanaStaking = networkType === 'solana';
    const isCardanoStaking = networkType === 'cardano';
    const isTronStaking = networkType === 'tron';

    // Cardano has nothing to show before the stake key is registered; other networks offer the first stake here.
    const isStakeSectionShown = !isCardanoStaking || isStakingActive;

    const historyHeadingId: TxKeyPath = isSolanaStaking
        ? 'earn.stakingManagementScreen.rewardsList.title'
        : 'earn.stakingManagementScreen.stakingHistory';

    return (
        <VStack spacing="sp24" marginTop="sp16" paddingHorizontal="sp16">
            {isEthereumStaking && <InstantUnstakeConfirmationBanner accountKey={accountKey} />}

            {isStakingSymbol(networkSymbol) && (
                <ContextMessage context={Context.getStaking(networkSymbol)} />
            )}

            {isTronStaking ? (
                <TronStakingPendingSection accountKey={accountKey} />
            ) : (
                <StakingManagementPendingSection accountKey={accountKey} />
            )}

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

            {isTronStaking && <TronResourcesCard accountKey={accountKey} />}

            <Text variant="headline-sm">
                <Translation id={historyHeadingId} />
            </Text>
        </VStack>
    );
};
