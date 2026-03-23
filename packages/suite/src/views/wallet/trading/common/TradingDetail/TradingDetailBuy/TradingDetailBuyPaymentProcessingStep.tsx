import { type BuyProviderInfo, type BuyTrade } from 'invity-api';

import { Translation, useTranslation } from '@suite/intl';
import { type BulletListItemState, Card, Column } from '@trezor/components';

import { TradingDetailProviderInfo } from '../TradingDetailProviderInfo';
import { TradingDetailStep } from '../TradingDetailStep';
import { TradingDetailSupportBanner } from '../TradingDetailSupportBanner';

const getState = (trade: BuyTrade): BulletListItemState => {
    switch (trade.status) {
        case 'APPROVAL_PENDING':
            return 'active';
        case 'SUCCESS':
            return 'done';
        default:
            return 'pending';
    }
};

type TradingDetailBuyPaymentProcessingStepProps = {
    trade: BuyTrade;
    provider?: BuyProviderInfo;
};

export const TradingDetailBuyPaymentProcessingStep = ({
    trade,
    provider,
}: TradingDetailBuyPaymentProcessingStepProps) => {
    const { translationString } = useTranslation();

    const providerName = provider?.brandName ?? provider?.companyName ?? provider?.name ?? '';

    return (
        <TradingDetailStep
            state={getState(trade)}
            title={
                <Translation
                    id="TR_TRADING_DETAIL_PROCESSING"
                    values={{
                        providerName,
                        type: translationString('TR_BUY').toLowerCase(),
                    }}
                />
            }
        >
            <Card>
                <Column gap={24}>
                    {provider && (
                        <TradingDetailProviderInfo
                            orderId={trade.paymentId}
                            provider={provider}
                            trade={trade}
                        />
                    )}
                    <TradingDetailSupportBanner provider={provider} trade={trade} />
                </Column>
            </Card>
        </TradingDetailStep>
    );
};
