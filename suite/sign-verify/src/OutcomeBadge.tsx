import { Translation } from '@suite/intl';
import { Badge } from '@trezor/components';
import { CheckCircleIcon, WarningCircleIcon } from '@trezor/icons';

import { type SignVerifyOutcome } from './types';

const outcomeBadges = {
    signed: { intent: 'brand', icon: CheckCircleIcon, labelId: 'TR_SIGNED_MESSAGE_BADGE' },
    verified: { intent: 'brand', icon: CheckCircleIcon, labelId: 'TR_VERIFIED_MESSAGE_BADGE' },
    failed: {
        intent: 'critical',
        icon: WarningCircleIcon,
        labelId: 'TR_VERIFICATION_FAILED_BADGE',
    },
} as const satisfies Record<Exclude<SignVerifyOutcome, 'idle'>, unknown>;

type OutcomeBadgeProps = {
    outcome: Exclude<SignVerifyOutcome, 'idle'>;
};

export const OutcomeBadge = ({ outcome }: OutcomeBadgeProps) => {
    const { intent, icon, labelId } = outcomeBadges[outcome];

    return (
        <Badge intent={intent} iconRight={icon} data-testid={`@sign-verify/outcome/${outcome}`}>
            <Translation id={labelId} />
        </Badge>
    );
};
