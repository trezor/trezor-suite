import { type BuyProviderInfo, type BuyTrade } from 'invity-api';

import { Translation, useTranslation } from '@suite/intl';
import { Card, Column, type StepListItemState } from '@trezor/components';

import { TradingDetailProviderInfo } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailProviderInfo';
import { TradingDetailStep } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailStep';
import { TradingDetailSupportBanner } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailSupportBanner';

const getState = (trade: BuyTrade): StepListItemState => {
    switch (trade.status) {
        case 'APPROVAL_PENDING':
            return 'active';
        case 'SUCCESS':
            return 'done';
        default:
            return 'pending';
    }
};

type TradingBuyDetailPaymentProcessingStepProps = {
    trade: BuyTrade;
    provider?: BuyProviderInfo;
};

export const TradingBuyDetailPaymentProcessingStep = ({
    trade,
    provider,
}: TradingBuyDetailPaymentProcessingStepProps) => {
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
