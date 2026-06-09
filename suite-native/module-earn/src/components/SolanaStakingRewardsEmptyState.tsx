import { RoundedIcon, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { SOLANA_EPOCH_DAYS } from '@trezor/coins-solana/constants';

export const SolanaStakingRewardsEmptyState = () => (
    <VStack marginTop="sp24" marginHorizontal="sp16" spacing="sp16" alignItems="center">
        <RoundedIcon name="arrowLineDown" intent="neutral" size={48} />
        <VStack alignItems="center" spacing="sp4">
            <Text textAlign="center" variant="headline-sm">
                <Translation id="earn.stakingManagementScreen.rewardsList.empty.title" />
            </Text>
            <Text textAlign="center" color="contentSecondary">
                <Translation
                    id="earn.stakingManagementScreen.rewardsList.empty.description"
                    values={{ days: SOLANA_EPOCH_DAYS }}
                />
            </Text>
        </VStack>
    </VStack>
);
