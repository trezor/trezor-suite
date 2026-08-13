import { type ReactNode } from 'react';

import { type Variant } from '@suite-common/suite-types';
import { type WrappedNativeFlowType, type YieldFlowType } from '@suite-common/wallet-core';
import { BannerInline } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';

const yieldDisabledTitleMap = {
    deposit: 'earn.messageSystem.depositDisabled',
    withdraw: 'earn.messageSystem.withdrawDisabled',
    redeem: 'earn.messageSystem.withdrawDisabled',
    claim: 'earn.messageSystem.claimDisabled',
    wrap: 'earn.messageSystem.wrapDisabled',
    unwrap: 'earn.messageSystem.unwrapDisabled',
} as const satisfies Record<YieldFlowType | WrappedNativeFlowType, TxKeyPath>;

type YieldDisabledAlertProps = {
    type: YieldFlowType | WrappedNativeFlowType;
    content?: ReactNode;
    variant?: Variant;
};

export const YieldDisabledAlert = ({ type, content, variant }: YieldDisabledAlertProps) => (
    <BannerInline
        intent={variant ?? 'warning'}
        title={content ?? <Translation id={yieldDisabledTitleMap[type]} />}
    />
);
