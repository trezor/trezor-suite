import { type ExchangeProviderInfo, type ExchangeTrade } from 'invity-api';

import { Translation, useTranslation } from '@suite/intl';
import { Card, Column, type StepListItemState } from '@trezor/components';

import { type Account } from 'src/types/wallet';
import { TradingDetailProviderInfo } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailProviderInfo';
import { TradingDetailStep } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailStep';
import { TradingDetailSupportBanner } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailSupportBanner';

const getState = (trade: ExchangeTrade, isDex?: boolean): StepListItemState => {
    switch (trade.status) {
        case 'SUCCESS':
            return 'done';
        case 'CONVERTING':
            return 'active';
        default:
            return isDex ? 'active' : 'pending';
    }
};

type TradingExchangeDetailPaymentConvertingProps = {
    trade: ExchangeTrade;
    provider?: ExchangeProviderInfo;
    account?: Account;
    isDex?: boolean;
};

export const TradingExchangeDetailPaymentConverting = ({
    trade,
    provider,
    account,
    isDex,
}: TradingExchangeDetailPaymentConvertingProps) => {
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
