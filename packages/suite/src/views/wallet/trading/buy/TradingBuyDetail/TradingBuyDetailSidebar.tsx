import { Translation } from '@suite/intl';
import type {
    TradingPaymentMethodType,
    TradingProviderInfo,
    TradingTradeType,
} from '@suite-common/trading';
import { Card, Column } from '@trezor/components';

import type { TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';
import type { Account } from 'src/types/wallet';
import { TradingDetailTradeInfo } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTradeInfo';
import { TradingFiatAmountInfoItem } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingFiatAmountInfoItem';
import { TradingInfoItem } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingInfoItem';
import { TradingPaymentMethodInfoItem } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingPaymentMethodInfoItem';

type TradingBuyDetailSidebarProps = {
    receiveAccount?: Account;
    paymentMethod?: TradingPaymentMethodType;
    paymentMethodName?: string;
    quoteAmounts: TradingGetCryptoQuoteAmountProps;
    date: string;
    orderId?: string;
    provider?: TradingProviderInfo;
    trade: TradingTradeType;
};

export const TradingBuyDetailSidebar = ({
    receiveAccount,
    paymentMethod,
    paymentMethodName,
    quoteAmounts,
    date,
    orderId,
    provider,
    trade,
}: TradingBuyDetailSidebarProps) => (
    <Card paddingType="none" data-testid="@trading/transaction/detail/sidebar">
        <Column gap={24} padding={24}>
            <TradingInfoItem
                account={receiveAccount}
                label="TR_TRADING_YOU_GET"
                currency={quoteAmounts.receiveCurrency}
                amount={quoteAmounts.receiveAmount}
                isReceive
            />

            <Column gap={12}>
                <TradingFiatAmountInfoItem
                    amount={quoteAmounts.sendAmount}
                    currency={quoteAmounts.sendCurrency}
                    disableHiddenPlaceholder
                    label={<Translation id="TR_TRADING_YOU_PAY" />}
                />

                {paymentMethod && (
                    <TradingPaymentMethodInfoItem
                        paymentMethod={paymentMethod}
                        paymentMethodName={paymentMethodName}
                    />
                )}
            </Column>

            <TradingDetailTradeInfo
                date={date}
                orderId={orderId}
                provider={provider}
                trade={trade}
            />
        </Column>
    </Card>
);
