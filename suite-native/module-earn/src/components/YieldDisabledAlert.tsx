import { type ReactNode } from 'react';

import { type Variant } from '@suite-common/suite-types';
import { type YieldFlowType } from '@suite-common/wallet-core';
import { InlineAlertBox } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';

const yieldDisabledTitleMap = {
    deposit: 'earn.messageSystem.depositDisabled',
    withdraw: 'earn.messageSystem.withdrawDisabled',
    redeem: 'earn.messageSystem.withdrawDisabled',
    claim: 'earn.messageSystem.claimDisabled',
} as const satisfies Record<YieldFlowType, TxKeyPath>;

type YieldDisabledAlertProps = {
    type: YieldFlowType;
    content?: ReactNode;
    variant?: Variant;
};

export const YieldDisabledAlert = ({ type, content, variant }: YieldDisabledAlertProps) => (
    <InlineAlertBox
        intent={variant ?? 'warning'}
        title={content ?? <Translation id={yieldDisabledTitleMap[type]} />}
    />
);
