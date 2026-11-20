import styled from 'styled-components';

import { injectDesktopAnalytics } from '@suite/analytics';
import { Translation, type TranslationKey } from '@suite/intl';
import { EarnAnchor, gotoThunk } from '@suite/router';
import { events as sharedEvents } from '@suite-common/analytics';
import { type StakingRateKind } from '@suite-common/earn-staking-common';
import { type Account } from '@suite-common/wallet-types';
import { Badge, type BadgeProps, commonFocusStyles } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { TrendUpIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';
import { getBorderRadiusCssValue } from '@trezor/theme';

import { getYieldOpportunityAnchor } from '#src/components/earn/utils/getYieldOpportunityAnchor';
import { useFormatApy } from '#src/hooks/earn/useFormatApy';

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

const YIELD_BADGE_TEST_ID = '@earn/yield-badge';

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

type GetVariantConfigParams = {
    variant: YieldBadgeVariant;
    rateKind: StakingRateKind;
};

const getVariantConfig = ({ variant, rateKind }: GetVariantConfigParams) => {
    const variantConfigMap: Record<YieldBadgeVariant, YieldBadgeVariantConfig> = {
        inactive: {
            translationId:
                rateKind === 'apy'
                    ? 'TR_EARN_YIELD_BADGE_UP_TO_RATE_APY'
                    : 'TR_EARN_YIELD_BADGE_UP_TO_RATE_APR',
            priority: 'secondary',
            shouldAnchorAtVaultRow: true,
        },
        active: {
            translationId:
                rateKind === 'apy'
                    ? 'TR_EARN_YIELD_BADGE_RATE_APY'
                    : 'TR_EARN_YIELD_BADGE_RATE_APR',
            shouldAnchorAtVaultRow: true,
        },
        promo: {
            translationId:
                rateKind === 'apy'
                    ? 'TR_EARN_YIELD_BADGE_UP_TO_RATE_APY'
                    : 'TR_EARN_YIELD_BADGE_UP_TO_RATE_APR',
            iconLeft: TrendUpIcon,
            shouldAnchorAtVaultRow: false,
        },
    };

    return variantConfigMap[variant];
};

/** Without an account the badge is a plain label: nothing to open on the Earn page for it. */
type YieldBadgeNavigationProps =
    | {
          account: Account;
          vaultId?: string;
          analyticsFrom: 'account-tokens' | 'account-defi-tokens' | 'account-tradebox';
      }
    | { account?: undefined; vaultId?: undefined; analyticsFrom?: undefined };

type YieldBadgeProps = YieldBadgeNavigationProps & {
    rate: number;
    rateKind: StakingRateKind;
    /** `inactive` = eligible but not yielding, `active` = already yielding, `promo` = trade box teaser. */
    variant: YieldBadgeVariant;
};

export const YieldBadge = ({
    rate,
    rateKind,
    variant,
    account,
    vaultId,
    analyticsFrom,
}: YieldBadgeProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const formatApyValue = useFormatApy();

    const { translationId, iconLeft, priority, shouldAnchorAtVaultRow } = getVariantConfig({
        variant,
        rateKind,
    });

    const badge = (
        <Badge
            intent="brand"
            size="small"
            priority={priority}
            iconLeft={iconLeft}
            // Tests reach the badge by this id: the button around it carries it when there is one.
            data-testid={account === undefined ? YIELD_BADGE_TEST_ID : undefined}
        >
            <Translation id={translationId} values={{ rate: formatApyValue(rate) }} />
        </Badge>
    );

    if (account === undefined) {
        return badge;
    }

    const goToEarnYield = () => {
        if (!vaultId) return;

        // The row anchor scrolls to and highlights the vault row of this very account; the
        // Earn page falls back to scrolling the yield section when that row is not rendered.
        const anchor = shouldAnchorAtVaultRow
            ? (getYieldOpportunityAnchor({ account, vaultId }) ?? EarnAnchor.Yield)
            : undefined;

        dispatch(gotoThunk({ routeName: 'suite-earn', anchor }));

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
        <BadgeButton type="button" onClick={goToEarnYield} data-testid={YIELD_BADGE_TEST_ID}>
            {badge}
        </BadgeButton>
    );
};
