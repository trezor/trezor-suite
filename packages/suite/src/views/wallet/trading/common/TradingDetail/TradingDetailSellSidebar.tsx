import { Translation } from '@suite/intl';
import type { TradingPaymentMethodType } from '@suite-common/trading';
import { Card, Column } from '@trezor/components';

import type { TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';
import type { Account } from 'src/types/wallet';
import { TradingFiatAmountInfoItem } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingFiatAmountInfoItem';
import { TradingInfoItem } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingInfoItem';
import { TradingPaymentMethodInfoItem } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingPaymentMethodInfoItem';

type TradingDetailSellSidebarProps = {
    sendAccount?: Account;
    paymentMethod?: TradingPaymentMethodType;
    paymentMethodName?: string;
    quoteAmounts: TradingGetCryptoQuoteAmountProps;
};

export const TradingDetailSellSidebar = ({
    sendAccount,
    paymentMethod,
    paymentMethodName,
    quoteAmounts,
}: TradingDetailSellSidebarProps) => (
    <Card paddingType="none" data-testid="@trading/transaction/detail/sidebar">
        <Column gap={24} padding={24}>
            <TradingInfoItem
                account={sendAccount}
                type="sell"
                label="TR_TRADING_YOU_PAY"
                currency={quoteAmounts.receiveCurrency}
                amount={quoteAmounts.receiveAmount}
            />

            <Column gap={12}>
                <TradingFiatAmountInfoItem
                    amount={quoteAmounts.sendAmount}
                    currency={quoteAmounts.sendCurrency}
                    disableHiddenPlaceholder
                    label={<Translation id="TR_TRADING_YOU_GET" />}
                />

                {paymentMethod && (
                    <TradingPaymentMethodInfoItem
                        paymentMethod={paymentMethod}
                        paymentMethodName={paymentMethodName}
                    />
                )}
            </Column>
        </Column>
    </Card>
);
