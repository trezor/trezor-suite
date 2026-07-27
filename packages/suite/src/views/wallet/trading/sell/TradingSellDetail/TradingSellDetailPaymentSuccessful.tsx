import { type SellFiatTrade, type SellProviderInfo } from 'invity-api';

import { Translation, useTranslation } from '@suite/intl';
import { Card, Column, Paragraph, type StepListItemState } from '@trezor/components';

import { TradingDetailProviderInfo } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailProviderInfo';
import { TradingDetailStep } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailStep';
import { TradingDetailSupportBanner } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailSupportBanner';

const getState = (trade: SellFiatTrade): StepListItemState => {
    switch (trade.status) {
        case 'SUCCESS':
            return 'active';
        default:
            return 'pending';
    }
};

type TradingSellDetailPaymentSuccessfulProps = {
    trade: SellFiatTrade;
    provider?: SellProviderInfo;
};

export const TradingSellDetailPaymentSuccessful = ({
    trade,
    provider,
}: TradingSellDetailPaymentSuccessfulProps) => {
    const { translationString } = useTranslation();
    const state = getState(trade);

    const providerName = provider?.companyName ?? provider?.name ?? '';

    return (
        <TradingDetailStep
            state={state}
            title={
                <Translation
                    id="TR_TRADING_DETAIL_PROCESSING"
                    values={{
                        providerName,
                        type: translationString('TR_TRADING_SELL').toLowerCase(),
                    }}
                />
            }
        >
            <Column gap={12}>
                <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation id="TR_SELL_DETAIL_PROCESSING_TEXT" values={{ providerName }} />
                </Paragraph>
                {provider && (
                    <Card>
                        <Column gap={24}>
                            <TradingDetailProviderInfo
                                orderId={trade.orderId}
                                provider={provider}
                                trade={trade}
                            />
                            <TradingDetailSupportBanner provider={provider} trade={trade} />
                        </Column>
                    </Card>
                )}
            </Column>
        </TradingDetailStep>
    );
};
