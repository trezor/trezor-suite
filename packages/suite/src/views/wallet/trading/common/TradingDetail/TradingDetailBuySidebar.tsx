import { Translation } from '@suite/intl';
import type { TradingPaymentMethodType } from '@suite-common/trading';
import { Card, Column } from '@trezor/components';

import type { TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';
import type { Account } from 'src/types/wallet';
import { TradingFiatAmountInfoItem } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingFiatAmountInfoItem';
import { TradingInfoItem } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingInfoItem';
import { TradingPaymentMethodInfoItem } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingPaymentMethodInfoItem';

type TradingDetailBuySidebarProps = {
    receiveAccount?: Account;
    paymentMethod?: TradingPaymentMethodType;
    paymentMethodName?: string;
    quoteAmounts: TradingGetCryptoQuoteAmountProps;
};

export const TradingDetailBuySidebar = ({
    receiveAccount,
    paymentMethod,
    paymentMethodName,
    quoteAmounts,
}: TradingDetailBuySidebarProps) => (
    <Card paddingType="none" data-testid="@trading/transaction/detail/sidebar">
        <Column gap={24} padding={24}>
            <TradingInfoItem
                account={receiveAccount}
                type="buy"
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
        </Column>
    </Card>
);
