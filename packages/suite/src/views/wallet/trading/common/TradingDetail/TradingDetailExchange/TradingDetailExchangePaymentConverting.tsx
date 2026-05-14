import { type ExchangeProviderInfo, type ExchangeTrade } from 'invity-api';

import { Translation, useTranslation } from '@suite/intl';
import { type BulletListItemState, Card, Column } from '@trezor/components';

import { type Account } from 'src/types/wallet';

import { TradingDetailProviderInfo } from '../TradingDetailProviderInfo';
import { TradingDetailStep } from '../TradingDetailStep';
import { TradingDetailSupportBanner } from '../TradingDetailSupportBanner';

const getState = (trade: ExchangeTrade, isDex?: boolean): BulletListItemState => {
    switch (trade.status) {
        case 'SUCCESS':
            return 'done';
        case 'CONVERTING':
            return 'active';
        default:
            return isDex ? 'active' : 'pending';
    }
};

type TradingDetailExchangePaymentConvertingProps = {
    trade: ExchangeTrade;
    provider?: ExchangeProviderInfo;
    account?: Account;
    isDex?: boolean;
};

export const TradingDetailExchangePaymentConverting = ({
    trade,
    provider,
    account,
    isDex,
}: TradingDetailExchangePaymentConvertingProps) => {
    const { translationString } = useTranslation();

    const providerName = provider?.companyName ?? provider?.name ?? '';

    return (
        <TradingDetailStep
            state={getState(trade, isDex)}
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
                            account={account}
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
