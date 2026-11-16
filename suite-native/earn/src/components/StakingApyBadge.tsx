import { useNetworkStakingRate } from '@suite-common/earn-staking';
import { useFormatters } from '@suite-common/formatters';
import { type Account } from '@suite-common/wallet-types';
import { HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { type TokenYieldRateToken } from '../hooks/useAssetYieldRate';

type StakingApyBadgeProps = {
    account: Account;
    token?: TokenYieldRateToken;
};

export const StakingApyBadge = ({ account }: StakingApyBadgeProps) => {
    const { PercentageFormatter } = useFormatters();
    const { rate, rateKind } = useNetworkStakingRate({
        networkSymbol: account.symbol,
        accountKey: account.key,
    });

    if (!rate) return null;

    return (
        <HStack spacing="sp8" alignItems="center" testID="@accountList/item/yieldRateBadge">
            <Icon name="trendUp" size="medium" color="borderOnDarkBrand" />
            <Text variant="body-sm" color="borderOnDarkBrand">
                <Translation
                    id={rateKind === 'apr' ? 'earn.yieldRateBadge.apr' : 'earn.yieldRateBadge.apy'}
                    values={{ value: PercentageFormatter.format(rate) }}
                />
            </Text>
        </HStack>
    );
};
