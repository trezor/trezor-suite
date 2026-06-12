import { useCallback } from 'react';
import { type UseFormSetValue } from 'react-hook-form';

import { Translation, type TranslationKey } from '@suite/intl';
import {
    TRADING_FORM_PAYMENT_METHOD_SELECT,
    TRADING_FORM_PROVIDER_SELECT,
    selectTradingQuotesPerPaymentMethodByType,
} from '@suite-common/trading';
import { Modal } from '@trezor/components';
import { CardList } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    type TradingTradeBuySellType,
    type TradingTradeDetailBuySellType,
} from 'src/types/trading/trading';
import { type TradingBuySellFormProps } from 'src/types/trading/tradingForm';

import { PaymentMethodModalItem } from './PaymentMethodModalItem';

interface PaymentMethodModalProps {
    onClose: () => void;
    heading?: TranslationKey;
}

export const PaymentMethodModal = ({ onClose, heading }: PaymentMethodModalProps) => {
    const { type, setValue } = useTradingFormContext<TradingTradeBuySellType>();

    const quotes: TradingTradeDetailBuySellType[] = useSelector(state =>
        selectTradingQuotesPerPaymentMethodByType(state, type),
    );

    const selectPaymentMethod = useCallback(
        (quote: TradingTradeDetailBuySellType) => {
            // setValue is a union type that cannot be called directly, so we need to assert it
            const setValueTyped = setValue as UseFormSetValue<TradingBuySellFormProps>;
            setValueTyped(TRADING_FORM_PAYMENT_METHOD_SELECT, {
                value: quote.paymentMethod ?? '',
                label: quote.paymentMethodName ?? '',
            });
            setValueTyped(TRADING_FORM_PROVIDER_SELECT, undefined);
            onClose();
        },
        [setValue, onClose],
    );

    return (
        <Modal
            width={480}
            onCancel={onClose}
            heading={heading ? <Translation id={heading} /> : undefined}
        >
            <CardList>
                {quotes.map(quote => (
                    <PaymentMethodModalItem
                        key={quote.paymentMethod}
                        quote={quote}
                        onSelect={selectPaymentMethod}
                    />
                ))}
            </CardList>
        </Modal>
    );
};
