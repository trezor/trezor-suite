import { Translation } from '@suite/intl';
import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import type { TradingSelectedOfferInfoProps } from 'src/types/trading/tradingForm';
import { tradingGetAmountLabels } from 'src/utils/wallet/trading/tradingUtils';

import { TradingFiatAmountInfoItem } from './TradingInfo/TradingFiatAmountInfoItem';
import { TradingInfoItem } from './TradingInfo/TradingInfoItem';
import { TradingPaymentMethodInfoItem } from './TradingInfo/TradingPaymentMethodInfoItem';
import { TradingProviderInfoItem } from './TradingInfo/TradingProviderInfoItem';

export const TradingSelectedOfferInfo = ({
    type,
    selectedQuote,
    providers,
    quoteAmounts,
    selectedAccount,
    receiveAddress,
    paymentMethod,
    paymentMethodName,
}: TradingSelectedOfferInfoProps) => {
    const { exchange } = selectedQuote;

    const amountInCrypto = quoteAmounts?.amountInCrypto ?? true;
    const amountLabels = tradingGetAmountLabels({ type, amountInCrypto });

    return (
        <Column gap={spacings.lg} data-testid="@trading/form/info">
            <TradingInfoItem
                account={selectedAccount}
                label={amountLabels.receiveLabel}
                currency={quoteAmounts?.receiveCurrency}
                amount={quoteAmounts?.receiveAmount}
                receiveAddress={receiveAddress}
                isReceive={type === 'buy'}
            />

            <Column gap={spacings.xs}>
                <TradingFiatAmountInfoItem
                    amount={quoteAmounts?.sendAmount}
                    currency={quoteAmounts?.sendCurrency}
                    label={<Translation id={amountLabels.sendLabel} />}
                />

                {paymentMethod && (
                    <TradingPaymentMethodInfoItem
                        paymentMethod={paymentMethod}
                        paymentMethodName={paymentMethodName}
                    />
                )}

                <TradingProviderInfoItem providers={providers} exchange={exchange} />
            </Column>
        </Column>
    );
};
