import { PaymentMethodIcon } from '@suite/trading';
import { CardList, Column, Row } from '@trezor/components';

import { type TradingTradeDetailBuySellType } from 'src/types/trading/trading';

import { TradingQuoteAmount } from '../../../TradingQuoteAmount';
import { TradingRequestedAmountShortfallNote } from '../../../TradingRequestedAmountShortfallNote';

type PaymentMethodModalItemProps = {
    quote: TradingTradeDetailBuySellType;
    onSelect: (quote: TradingTradeDetailBuySellType) => void;
};

export const PaymentMethodModalItem = ({ quote, onSelect }: PaymentMethodModalItemProps) => (
    <CardList.Item
        onClick={() => onSelect(quote)}
        data-testid={`@trading/form/payment-method-select/option/${quote.paymentMethod}`}
    >
        <Row justifyContent="start" gap={16} alignItems="start" width="100%">
            <PaymentMethodIcon paymentMethod={quote.paymentMethod ?? ''} />
            <Column width="100%" gap={4}>
                <Row justifyContent="space-between" gap={8}>
                    {quote.paymentMethodName}
                    <TradingQuoteAmount quote={quote} />
                </Row>
                <TradingRequestedAmountShortfallNote quote={quote} />
            </Column>
        </Row>
    </CardList.Item>
);
