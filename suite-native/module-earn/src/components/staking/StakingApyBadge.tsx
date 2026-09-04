import { type Account } from '@suite-common/wallet-types';
import { HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { useStakingRate } from '../../hooks/staking/useStakingRate';
import { type TokenYieldRateToken } from '../../hooks/yield/useTokenYieldRate';

type StakingApyBadgeProps = {
    account: Account;
    token?: TokenYieldRateToken;
};

export const StakingApyBadge = ({ account }: StakingApyBadgeProps) => {
    const { rate } = useStakingRate({ accountKey: account.key, symbol: account.symbol });

    if (!rate) return null;

    const isTron = account.symbol === 'trx';

    return (
        <HStack spacing="sp8" alignItems="center" testID="@accountList/item/yieldRateBadge">
            <Icon name="trendUp" size="medium" color="borderOnDarkBrand" />
            <Text variant="body-sm" color="borderOnDarkBrand">
                <Translation
                    id={isTron ? 'earn.yieldRateBadge.apr' : 'earn.yieldRateBadge.apy'}
                    values={{ value: rate }}
                />
            </Text>
        </HStack>
    );
};
