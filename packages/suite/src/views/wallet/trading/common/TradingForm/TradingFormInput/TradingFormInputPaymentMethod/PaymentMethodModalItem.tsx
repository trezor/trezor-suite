import { Translation } from '@suite/intl';
import { PaymentMethodIcon } from '@suite/trading';
import { CardList, Column, Row, Text } from '@trezor/components';

import { type TradingTradeDetailBuySellType } from 'src/types/trading/trading';

import { useTradingOfferRate } from '../../../TradingOffers/useTradingOfferRate';

type PaymentMethodModalItemProps = {
    quote: TradingTradeDetailBuySellType;
    onSelect: (quote: TradingTradeDetailBuySellType) => void;
};

export const PaymentMethodModalItem = ({ quote, onSelect }: PaymentMethodModalItemProps) => {
    const formattedRate = useTradingOfferRate(quote);

    return (
        <CardList.Item
            onClick={() => onSelect(quote)}
            data-testid={`@trading/form/payment-method-select/option/${quote.paymentMethod}`}
        >
            <Row justifyContent="start" gap={16} alignItems="start" width="100%">
                <PaymentMethodIcon paymentMethod={quote.paymentMethod ?? ''} />
                <Column width="100%">
                    <Row>{quote.paymentMethodName}</Row>
                    {formattedRate && (
                        <Row justifyContent="space-between">
                            <Text typographyStyle="body-sm" color="contentSecondary">
                                <Translation id="TR_TRADING_RATE" />
                            </Text>
                            <Text typographyStyle="body-sm" color="contentSecondary">
                                {formattedRate}
                            </Text>
                        </Row>
                    )}
                </Column>
            </Row>
        </CardList.Item>
    );
};
