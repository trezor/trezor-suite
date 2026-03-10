import { Translation } from '@suite/intl';
import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import type { TradingOfferSellProps } from 'src/types/trading/tradingForm';
import type { Account } from 'src/types/wallet';
import { tradingGetAmountLabels } from 'src/utils/wallet/trading/tradingUtils';

import { TradingFiatAmountInfoItem } from './TradingInfo/TradingFiatAmountInfoItem';
import { TradingInfoItem } from './TradingInfo/TradingInfoItem';
import { TradingPaymentMethodInfoItem } from './TradingInfo/TradingPaymentMethodInfoItem';
import { TradingProviderInfoItem } from './TradingInfo/TradingProviderInfoItem';

type TradingSelectedOfferInfoProps = TradingOfferSellProps & {
    selectedAccount?: Account;
};

export const TradingSelectedOfferInfo = ({
    selectedQuote,
    providers,
    quoteAmounts,
    selectedAccount,
    paymentMethod,
    paymentMethodName,
}: TradingSelectedOfferInfoProps) => {
    const { exchange } = selectedQuote;

    const amountInCrypto = quoteAmounts?.amountInCrypto ?? true;
    const amountLabels = tradingGetAmountLabels({ type: 'sell', amountInCrypto });

    return (
        <Column gap={spacings.lg} data-testid="@trading/form/info">
            <TradingInfoItem
                account={selectedAccount}
                type="sell"
                label={amountLabels.receiveLabel}
                currency={quoteAmounts?.receiveCurrency}
                amount={quoteAmounts?.receiveAmount}
            />

            <Column gap={spacings.xs}>
                <TradingFiatAmountInfoItem
                    amount={quoteAmounts?.sendAmount}
                    currency={quoteAmounts?.sendCurrency}
                    label={<Translation id={amountLabels.sendLabel} />}
                />

                <TradingProviderInfoItem providers={providers} exchange={exchange} />

                {paymentMethod && (
                    <TradingPaymentMethodInfoItem
                        paymentMethod={paymentMethod}
                        paymentMethodName={paymentMethodName}
                    />
                )}
            </Column>
        </Column>
    );
};
