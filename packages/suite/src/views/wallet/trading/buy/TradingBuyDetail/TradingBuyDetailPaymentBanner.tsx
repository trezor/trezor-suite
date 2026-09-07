import { type BuyProviderInfo, type BuyTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import { getStatusUrl } from '@suite-common/trading';
import { Banner } from '@trezor/components';
import { ArrowSquareOutIcon } from '@trezor/icons';

import { getBuyDetailStatusStep } from './utils';

type TradingBuyDetailPaymentBannerProps = {
    trade: BuyTrade;
    provider?: BuyProviderInfo;
};

export const TradingBuyDetailPaymentBanner = ({
    trade,
    provider,
}: TradingBuyDetailPaymentBannerProps) => {
    const isWaitingForPayment = getBuyDetailStatusStep(trade.status) === 'waiting';
    const hasStatusLink = !!getStatusUrl(provider, trade);

    if (!isWaitingForPayment || hasStatusLink) {
        return null;
    }

    return (
        <Banner
            intent="info"
            icon={ArrowSquareOutIcon}
            title={<Translation id="TR_BUY_DETAIL_PAYMENT_INTERRUPTION_TITLE" />}
            description={<Translation id="TR_BUY_DETAIL_PAYMENT_INTERRUPTION_TEXT" />}
            data-testid="@trading/transaction/detail/payment-interruption-banner"
        />
    );
};
