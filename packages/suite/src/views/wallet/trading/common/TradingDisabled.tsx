import React from 'react';

import { ExtendedMessageDescriptor } from '@suite-common/intl-types';
import { TradingType } from '@suite-common/trading';
import { Banner } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { useTranslation } from 'src/hooks/suite';

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
        <Banner icon="warning" variant="warning">
            {content ?? (
                <Translation
                    id="TR_TRADING_DISABLED_DEFAULT"
                    values={{ type: translationString(typeLabels[type]) }}
                />
            )}
        </Banner>
    );
};
