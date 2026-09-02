import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { type Variant } from '@suite-common/suite-types';
import type { WrappedNativeFlowType, YieldFlowType } from '@suite-common/wallet-core';
import { Banner } from '@trezor/components';

type YieldDisabledBannerProps = {
    type: YieldFlowType | WrappedNativeFlowType;
    content?: ReactNode;
    variant?: Variant;
};

const yieldDisabledMessageMap = {
    deposit: 'TR_EARN_YIELD_DEPOSIT_DISABLED',
    withdraw: 'TR_EARN_YIELD_WITHDRAW_DISABLED',
    redeem: 'TR_EARN_YIELD_WITHDRAW_DISABLED',
    claim: 'TR_EARN_YIELD_CLAIM_DISABLED',
    wrap: 'TR_EARN_YIELD_WRAP_DISABLED',
    unwrap: 'TR_EARN_YIELD_UNWRAP_DISABLED',
} as const;

export const YieldDisabledBanner = ({ type, content, variant }: YieldDisabledBannerProps) => (
    <Banner
        icon
        intent={variant ?? 'warning'}
        description={content ?? <Translation id={yieldDisabledMessageMap[type]} />}
    />
);
