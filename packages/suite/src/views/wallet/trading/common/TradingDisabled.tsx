import React from 'react';

import { type ExtendedMessageDescriptor, Translation, useTranslation } from '@suite/intl';
import { type TradingType } from '@suite-common/trading';
import { Banner } from '@trezor/components';

const typeLabels: Record<TradingDisabledProps['type'], ExtendedMessageDescriptor['id']> = {
    buy: 'TR_BUY',
    sell: 'TR_TRADING_SELL',
    exchange: 'TR_TRADING_SWAP',
};

type TradingDisabledProps = {
    type: TradingType;
    content?: string;
};

export const TradingDisabled = ({ type, content }: TradingDisabledProps) => {
    const { translationString } = useTranslation();

    return (
        <Banner
            icon="warning"
            intent="warning"
            description={
                content ?? (
                    <Translation
                        id="TR_TRADING_DISABLED_DEFAULT"
                        values={{ type: translationString(typeLabels[type]) }}
                    />
                )
            }
        />
    );
};
