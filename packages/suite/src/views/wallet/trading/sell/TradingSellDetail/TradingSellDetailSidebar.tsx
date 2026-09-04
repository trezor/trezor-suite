import type {
    TradingPaymentMethodType,
    TradingProviderInfo,
    TradingTradeType,
} from '@suite-common/trading';
import { Card, Column, Divider } from '@trezor/components';

import type { TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';
import type { Account } from 'src/types/wallet';
import { TradingDetailAssetRow } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailAssetRow';
import { TradingDetailFiatRow } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailFiatRow';
import { TradingDetailSidebarSection } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailSidebarSection';
import { TradingDetailTradeInfo } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTradeInfo';
import { TradingPaymentMethodInfoItem } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingPaymentMethodInfoItem';

type TradingSellDetailSidebarProps = {
    sendAccount?: Account;
    paymentMethod?: TradingPaymentMethodType;
    paymentMethodName?: string;
    quoteAmounts: TradingGetCryptoQuoteAmountProps;
    date: string;
    orderId?: string;
    provider?: TradingProviderInfo;
    trade: TradingTradeType;
};

export const TradingSellDetailSidebar = ({
    sendAccount,
    paymentMethod,
    paymentMethodName,
    quoteAmounts,
    date,
    orderId,
    provider,
    trade,
}: TradingSellDetailSidebarProps) => (
    <Card paddingType="none" data-testid="@trading/transaction/detail/sidebar">
        <Column gap={24} padding={{ vertical: 24 }}>
            <TradingDetailSidebarSection>
                <TradingDetailAssetRow
                    account={sendAccount}
                    label="TR_TRADING_YOU_PAY"
                    currency={quoteAmounts.receiveCurrency}
                    amount={quoteAmounts.receiveAmount}
                />
            </TradingDetailSidebarSection>

            <Divider margin={{ top: 0, bottom: 0 }} />

            <TradingDetailSidebarSection>
                <TradingDetailFiatRow
                    label="TR_TRADING_YOU_GET"
                    currency={quoteAmounts.sendCurrency}
                    amount={quoteAmounts.sendAmount}
                />
            </TradingDetailSidebarSection>

            <Divider margin={{ top: 0, bottom: 0 }} />

            <TradingDetailSidebarSection>
                <TradingDetailTradeInfo
                    date={date}
                    orderId={orderId}
                    provider={provider}
                    trade={trade}
                >
                    {paymentMethod && (
                        <TradingPaymentMethodInfoItem
                            paymentMethod={paymentMethod}
                            paymentMethodName={paymentMethodName}
                            label="TR_TRADING_RECEIVE_METHOD"
                        />
                    )}
                </TradingDetailTradeInfo>
            </TradingDetailSidebarSection>
        </Column>
    </Card>
);
