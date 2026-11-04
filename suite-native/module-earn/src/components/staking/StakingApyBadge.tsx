import { useFormatters } from '@suite-common/formatters';
import { type Account } from '@suite-common/wallet-types';
import { HStack, Text } from '@suite-native/atoms';
import { getStakingRateLabelType, useStakingRate } from '@suite-native/earn';
import { type TokenYieldRateToken } from '@suite-native/earn';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

type StakingApyBadgeProps = {
    account: Account;
    token?: TokenYieldRateToken;
};

export const StakingApyBadge = ({ account }: StakingApyBadgeProps) => {
    const { PercentageFormatter } = useFormatters();
    const { rate } = useStakingRate({ accountKey: account.key, symbol: account.symbol });

    if (!rate) return null;

    return (
        <HStack spacing="sp8" alignItems="center" testID="@accountList/item/yieldRateBadge">
            <Icon name="trendUp" size="medium" color="borderOnDarkBrand" />
            <Text variant="body-sm" color="borderOnDarkBrand">
                <Translation
                    id={
                        getStakingRateLabelType(account.symbol) === 'apr'
                            ? 'earn.yieldRateBadge.apr'
                            : 'earn.yieldRateBadge.apy'
                    }
                    values={{ value: PercentageFormatter.format(rate) }}
                />
            </Text>
        </HStack>
    );
};
