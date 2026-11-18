import { useFormatters } from '@suite-common/formatters';
import { type Account } from '@suite-common/wallet-types';
import { HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { type TokenYieldRateToken } from '../hooks/useAssetYieldRate';
import { useStakingRate } from '../hooks/useStakingRate';
import { getStakingRateLabelType } from '../utils/getYieldRateLabelType';

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
