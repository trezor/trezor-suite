import { useSelector } from 'react-redux';

import {
    type StakingRootState,
    selectIsStakingAccountWithoutPool,
    useNetworkStakingRate,
} from '@suite-common/earn-staking';
import { type Account } from '@suite-common/wallet-types';
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

    if (hasNoPool) {
        return (
            <Text
                variant="body-sm"
                color="contentSecondary"
                testID="@accountList/item/yieldRateBadge"
            >
                <Translation id="earn.yieldRateBadge.apy" values={{ value: 0 }} />
            </Text>
        );
    }

    // A product without a rate, a testnet, says so once its info is cached.
    if (isPending || rateKind === null) return null;

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
