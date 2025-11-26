import { BuyProviderInfo, BuyTrade } from 'invity-api';

import { formatDurationStrict } from '@suite-common/suite-utils';
import { BulletListItemState, Column } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';
import { useLocales } from 'src/hooks/suite';

import { TradingDetailInfo } from '../TradingDetailInfo';
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

type PaymentProcessingProps = {
    trade: BuyTrade;
    provider?: BuyProviderInfo;
    supportUrl?: string;
};

export const TradingDetailBuyPaymentProcessingStep = ({
    trade,
    provider,
    supportUrl,
}: PaymentProcessingProps) => {
    const locale = useLocales();

    const estimatedTimeSeconds = 5 * 60;
    const estimatedTime = `~${formatDurationStrict(estimatedTimeSeconds, locale)}`;

    return (
        <TradingDetailStep
            state={getState(trade)}
            title={
                <Translation
                    id="TR_BUY_PAYMENT_PROCESSING_TITLE"
                    values={{
                        providerName:
                            provider?.brandName ?? provider?.companyName ?? provider?.name,
                    }}
                />
            }
        >
            <Column gap={24}>
                {provider && (
                    <TradingDetailInfo
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
