import styled from 'styled-components';

import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation, type TranslationKey } from '@suite/intl';
import { EarnAnchor, goto } from '@suite/router';
import { events as sharedEvents } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';
import { Badge, type BadgeProps, commonFocusStyles } from '@trezor/components';
import { TrendUpIcon } from '@trezor/icons';
import { getBorderRadiusCssValue } from '@trezor/theme';

import { formatApyValue } from 'src/components/earn/utils/earnApyUtils';
import { getYieldOpportunityAnchor } from 'src/components/earn/utils/getYieldOpportunityAnchor';

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
    priority?: BadgeProps['priority'];
    iconLeft?: BadgeProps['iconLeft'];
    /**
     * Token badges point at the vault row of their account, the trade box teaser covers
     * staking too, so it opens the Earn page plain — no anchor, nothing highlighted.
     */
    shouldAnchorAtVaultRow: boolean;
};

const variantConfigMap: Record<YieldBadgeVariant, YieldBadgeVariantConfig> = {
    inactive: {
        translationId: 'TR_EARN_YIELD_BADGE_UP_TO_RATE',
        priority: 'secondary',
        shouldAnchorAtVaultRow: true,
    },
    active: {
        translationId: 'TR_EARN_YIELD_BADGE_RATE',
        shouldAnchorAtVaultRow: true,
    },
    promo: {
        translationId: 'TR_EARN_YIELD_BADGE_UP_TO_RATE',
        iconLeft: TrendUpIcon,
        shouldAnchorAtVaultRow: false,
    },
};

type YieldBadgeProps = {
    apy: number;
    /** `inactive` = eligible but not yielding, `active` = already yielding, `promo` = trade box teaser. */
    variant: YieldBadgeVariant;
    account: Account;
    vaultId: string;
    analyticsFrom: 'account-tokens' | 'account-defi-tokens' | 'account-tradebox';
};

export const YieldBadge = ({ apy, variant, account, vaultId, analyticsFrom }: YieldBadgeProps) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const dispatch = useDispatch();

    const { translationId, iconLeft, priority, shouldAnchorAtVaultRow } = variantConfigMap[variant];

    const goToEarnYield = () => {
        // The row anchor scrolls to and highlights the vault row of this very account; the
        // Earn page falls back to scrolling the yield section when that row is not rendered.
        const anchor = shouldAnchorAtVaultRow
            ? (getYieldOpportunityAnchor({ account, vaultId }) ?? EarnAnchor.Yield)
            : undefined;

        dispatch(goto({ routeName: 'suite-earn', anchor }));

        analytics.report({
            type: sharedEvents.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: analyticsFrom,
                to: 'earn-dashboard',
                networkSymbol: account.symbol,
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
