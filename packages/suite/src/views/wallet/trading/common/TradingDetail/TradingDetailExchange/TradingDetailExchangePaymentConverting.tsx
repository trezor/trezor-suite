import { ExchangeProviderInfo, ExchangeTrade } from 'invity-api';

import { formatDurationStrict } from '@suite-common/suite-utils';
import { BulletListItemState, Column } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';
import { useLocales } from 'src/hooks/suite';

import { TradingDetailProviderInfo } from '../TradingDetailProviderInfo';
import { TradingDetailStep } from '../TradingDetailStep';
import { TradingDetailSupportBanner } from '../TradingDetailSupportBanner';

const getState = (trade: ExchangeTrade): BulletListItemState => {
    switch (trade.status) {
        case 'SUCCESS':
            return 'done';
        case 'CONVERTING':
            return 'active';
        default:
            return 'pending';
    }
};

type PaymentConvertingProps = {
    trade: ExchangeTrade;
    provider?: ExchangeProviderInfo;
    supportUrl?: string;
};

export const TradingDetailExchangePaymentConverting = ({
    trade,
    provider,
    supportUrl,
}: PaymentConvertingProps) => {
    const locale = useLocales();

    const estimatedTimeSeconds = 60 * 60;
    const estimatedTime = `~${formatDurationStrict(estimatedTimeSeconds, locale)}`;

    const providerName = provider?.companyName ?? provider?.name ?? '';

    return (
        <TradingDetailStep
            state={getState(trade)}
            title={<Translation id="TR_EXCHANGE_DETAIL_PROCESSING" values={{ providerName }} />}
        >
            <Column gap={24}>
                {provider && (
                    <TradingDetailProviderInfo
                        estimatedTime={estimatedTime}
                        provider={provider}
                        trade={trade}
                    />
                )}
                {provider && supportUrl && (
                    <TradingDetailSupportBanner provider={provider} supportUrl={supportUrl} />
                )}
            </Column>
        </TradingDetailStep>
    );
};
