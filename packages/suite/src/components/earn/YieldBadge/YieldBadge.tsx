import styled from 'styled-components';

import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation, type TranslationKey } from '@suite/intl';
import { EarnAnchor, goto } from '@suite/router';
import { events as sharedEvents } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type NetworkSymbol } from '@suite-common/networks';
import { Badge, type BadgeProps, commonFocusStyles } from '@trezor/components';
import { TrendUpIcon } from '@trezor/icons';
import { getBorderRadiusCssValue } from '@trezor/theme';

import { formatApyValue } from 'src/components/earn/utils/earnApyUtils';
import { useDispatch } from 'src/hooks/suite';

// The badge itself is not interactive, so a button carries the click and the focus ring.
const BadgeButton = styled.button`
    display: inline-flex;
    padding: 0;
    border: none;
    border-radius: ${getBorderRadiusCssValue('full')};
    background: none;
    cursor: pointer;

    &:focus-visible {
        ${commonFocusStyles}
    }
`;

type YieldBadgeVariant = 'inactive' | 'active' | 'promo';

type YieldBadgeVariantConfig = {
    translationId: TranslationKey;
    priority: NonNullable<BadgeProps['priority']>;
    iconLeft?: BadgeProps['iconLeft'];
};

const variantConfigMap: Record<YieldBadgeVariant, YieldBadgeVariantConfig> = {
    inactive: {
        translationId: 'TR_EARN_YIELD_BADGE_UP_TO_RATE',
        priority: 'secondary',
    },
    active: {
        translationId: 'TR_EARN_YIELD_BADGE_RATE',
        priority: 'primary',
    },
    promo: {
        translationId: 'TR_EARN_YIELD_BADGE_UP_TO_RATE',
        priority: 'primary',
        iconLeft: TrendUpIcon,
    },
};

type YieldBadgeProps = {
    apy: number;
    /** `inactive` = eligible but not yielding, `active` = already yielding, `promo` = trade box teaser. */
    variant: YieldBadgeVariant;
    networkSymbol: NetworkSymbol;
    analyticsFrom: 'account-tokens' | 'account-defi-tokens' | 'account-tradebox';
    vaultId?: string;
};

export const YieldBadge = ({
    apy,
    variant,
    networkSymbol,
    analyticsFrom,
    vaultId,
}: YieldBadgeProps) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const dispatch = useDispatch();

    const { translationId, priority, iconLeft } = variantConfigMap[variant];

    const goToEarnYield = () => {
        dispatch(goto({ routeName: 'suite-earn', anchor: EarnAnchor.Yield }));

        analytics.report({
            type: sharedEvents.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: analyticsFrom,
                to: 'earn-dashboard',
                networkSymbol,
                vaultId,
            },
        });
    };

    return (
        <BadgeButton type="button" onClick={goToEarnYield} data-testid="@earn/yield-badge">
            <Badge intent="brand" size="small" priority={priority} iconLeft={iconLeft}>
                <Translation id={translationId} values={{ apy: formatApyValue(apy) }} />
            </Badge>
        </BadgeButton>
    );
};
