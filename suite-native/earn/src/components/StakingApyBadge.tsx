import { useSelector } from 'react-redux';

import {
    type StakingRootState,
    selectHasStakingAccountWarning,
    selectIsStakingAccountWithoutPool,
    useNetworkStakingRate,
} from '@suite-common/earn-staking';
import { type Account } from '@suite-common/wallet-types';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { type TokenYieldRateToken } from '../hooks/useAssetYieldRate';
import { useFormattedEarnRate } from '../hooks/useFormattedEarnRate';

type StakingApyBadgeProps = {
    account: Account;
    token?: TokenYieldRateToken;
};

export const StakingApyBadge = ({ account }: StakingApyBadgeProps) => {
    const { rate, rateKind, isPending } = useNetworkStakingRate({
        networkSymbol: account.symbol,
        accountKey: account.key,
    });
    const formattedRate = useFormattedEarnRate(rate);
    const hasNoPool = useSelector((state: StakingRootState) =>
        selectIsStakingAccountWithoutPool(state, account.key),
    );

    const hasOutdatedProvider = useSelector((state: StakingRootState) =>
        selectHasStakingAccountWarning(state, account.key, 'outdated-provider'),
    );

    // The retired provider already has a No rewards badge in the account row.
    if (hasOutdatedProvider || (!hasNoPool && (isPending || rateKind === null))) return null;

    if (hasNoPool || !isApyAvailable(rate)) {
        return (
            <Text
                variant="body-sm"
                color="contentSecondary"
                testID="@accountList/item/yieldRateBadge"
            >
                {hasNoPool ? <Translation id="earn.zeroApyBadge" /> : formattedRate}
            </Text>
        );
    }

    return (
        <HStack spacing="sp8" alignItems="center" testID="@accountList/item/yieldRateBadge">
            <Icon name="trendUp" size="medium" color="borderOnDarkBrand" />
            <Text variant="body-sm" color="borderOnDarkBrand">
                <Translation
                    id={rateKind === 'apr' ? 'earn.yieldRateBadge.apr' : 'earn.yieldRateBadge.apy'}
                    values={{ value: formattedRate }}
                />
            </Text>
        </HStack>
    );
};
