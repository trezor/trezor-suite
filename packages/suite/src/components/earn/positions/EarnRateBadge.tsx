import { Translation } from '@suite/intl';
import { type StakingRateKind } from '@suite-common/earn-staking-common';
import { Badge, type BadgeIntent } from '@trezor/components';

import { useFormatApy } from '#src/hooks/earn/useFormatApy';

type EarnRateBadgeProps = {
    rate: number | null;
    rateKind?: StakingRateKind;
};

export const EarnRateBadge = ({ rate, rateKind = 'apy' }: EarnRateBadgeProps) => {
    const formatApyValue = useFormatApy();

    const translationId =
        rateKind === 'apy' ? 'TR_EARN_YIELD_BADGE_RATE' : 'TR_EARN_YIELD_BADGE_RATE_APR';

    const intent: BadgeIntent = rate === null ? 'warning' : 'brand';

    return (
        <Badge intent={intent} size="small">
            {rate === null ? (
                <Translation
                    id={
                        rateKind === 'apy'
                            ? 'TR_EARN_APY_NOT_AVAILABLE'
                            : 'TR_EARN_APR_NOT_AVAILABLE'
                    }
                />
            ) : (
                <Translation id={translationId} values={{ [rateKind]: formatApyValue(rate) }} />
            )}
        </Badge>
    );
};
