import { SellFiatTrade, SellProviderInfo } from 'invity-api';

import { Translation, useTranslation } from '@suite/intl';
import { BulletListItemState, Card, Column, Paragraph } from '@trezor/components';

import { TradingDetailProviderInfo } from '../TradingDetailProviderInfo';
import { TradingDetailStep } from '../TradingDetailStep';
import { TradingDetailSupportBanner } from '../TradingDetailSupportBanner';

const getState = (trade: SellFiatTrade): BulletListItemState => {
    switch (trade.status) {
        case 'SUCCESS':
            return 'active';
        default:
            return 'pending';
    }
};

type TradingDetailSellPaymentSuccessfulProps = {
    trade: SellFiatTrade;
    provider?: SellProviderInfo;
};

export const TradingDetailSellPaymentSuccessful = ({
    trade,
    provider,
}: TradingDetailSellPaymentSuccessfulProps) => {
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
