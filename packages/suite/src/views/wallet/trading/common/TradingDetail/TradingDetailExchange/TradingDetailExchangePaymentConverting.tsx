import { type ExchangeProviderInfo, type ExchangeTrade } from 'invity-api';

import { Translation, useTranslation } from '@suite/intl';
import { type BulletListItemState, Card, Column } from '@trezor/components';

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

type TradingDetailExchangePaymentConvertingProps = {
    trade: ExchangeTrade;
    provider?: ExchangeProviderInfo;
};

export const TradingDetailExchangePaymentConverting = ({
    trade,
    provider,
}: TradingDetailExchangePaymentConvertingProps) => {
    const { translationString } = useTranslation();

    const providerName = provider?.companyName ?? provider?.name ?? '';

    return (
        <TradingDetailStep
            state={getState(trade)}
            title={
                <Translation
                    id="TR_TRADING_DETAIL_PROCESSING"
                    values={{
                        providerName,
                        type: translationString('TR_TRADING_SWAP').toLowerCase(),
                    }}
                />
            }
        >
            <Card>
                <Column gap={24}>
                    {provider && (
                        <TradingDetailProviderInfo
                            orderId={trade.orderId}
                            provider={provider}
                            trade={trade}
                            txId={trade.receiveTxHash}
                        />
                    )}
                    <TradingDetailSupportBanner provider={provider} trade={trade} />
                </Column>
            </Card>
        </TradingDetailStep>
    );
};
