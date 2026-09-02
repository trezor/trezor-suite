import { type Account } from '@suite-common/wallet-types';
import { HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation, type TxKeyPath } from '@suite-native/intl';

import {
    type TokenYieldRateToken,
    type TokenYieldRateVariant,
    useTokenYieldRate,
} from '../../hooks/yield/useTokenYieldRate';
import { type YieldRateLabelType } from '../../utils/yield/getYieldRateLabelType';

const translationIds: Record<TokenYieldRateVariant, Record<YieldRateLabelType, TxKeyPath>> = {
    inactive: {
        apy: 'earn.yieldRateBadge.upToApy',
        apr: 'earn.yieldRateBadge.upToApr',
        rate: 'earn.yieldRateBadge.upToRate',
    },
    active: {
        apy: 'earn.yieldRateBadge.apy',
        apr: 'earn.yieldRateBadge.apr',
        rate: 'earn.yieldRateBadge.rate',
    },
};

type TokenYieldRateBadgeProps = {
    account: Account;
    /** Native-coin rows pass no token — the rate of wrapped-native vaults is shown. */
    token?: TokenYieldRateToken;
    variant: TokenYieldRateVariant;
};

/** Rate of the best yield vault a token row can earn with, e.g. `up to 6.42% APY`. */
export const TokenYieldRateBadge = ({ account, token, variant }: TokenYieldRateBadgeProps) => {
    const yieldRate = useTokenYieldRate({ account, token, variant });

    if (!yieldRate) {
        return null;
    }

    const color = variant === 'active' ? 'borderOnDarkBrand' : 'contentBrand';

    return (
        <HStack spacing="sp8" alignItems="center" testID="@accountList/item/yieldRateBadge">
            {variant === 'active' && <Icon name="trendUp" size="medium" color={color} />}
            <Text variant="body-sm" color={color}>
                <Translation
                    id={translationIds[variant][yieldRate.labelType]}
                    values={{ value: yieldRate.apy }}
                />
            </Text>
        </HStack>
    );
};
