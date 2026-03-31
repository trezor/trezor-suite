import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { Banner } from '@trezor/components';

import type { YieldFlowType } from '../types';

type YieldDisabledBannerProps = {
    type: YieldFlowType;
    content?: ReactNode;
};

const yieldDisabledMessageMap = {
    supply: 'TR_EARN_YIELD_SUPPLY_DISABLED',
    withdraw: 'TR_EARN_YIELD_WITHDRAW_DISABLED',
} as const;

export const YieldDisabledBanner = ({ type, content }: YieldDisabledBannerProps) => (
    <Banner
        icon="warning"
        intent="warning"
        description={content ?? <Translation id={yieldDisabledMessageMap[type]} />}
    />
);
