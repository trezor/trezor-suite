import { useCallback } from 'react';
import { type UseFormSetValue } from 'react-hook-form';

import { Translation, type TranslationKey } from '@suite/intl';
import { PaymentMethodIcon } from '@suite/trading';
import {
    TRADING_FORM_PAYMENT_METHOD_SELECT,
    TRADING_FORM_PROVIDER_SELECT,
    type TradingPaymentMethodListProps,
} from '@suite-common/trading';
import { Column, Modal, Row, Text } from '@trezor/components';
import { CardList } from '@trezor/product-components';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { type TradingTradeBuySellType } from 'src/types/trading/trading';
import { type TradingBuySellFormProps } from 'src/types/trading/tradingForm';

import { useTradingRateFromOperationData } from '../../../TradingOffers/useTradingOfferRate';

interface PaymentMethodModalProps {
    onClose: () => void;
    heading?: TranslationKey;
}

interface PaymentMethodModalItemProps {
    item: TradingPaymentMethodListProps;
    onSelect: (paymentMethod: TradingPaymentMethodListProps) => void;
}

const PaymentMethodModalItem = ({ item, onSelect }: PaymentMethodModalItemProps) => {
    const formattedRate = useTradingRateFromOperationData(item.tradeOperationData);

    return (
        <CardList.Item
            onClick={() => onSelect(item)}
            data-testid={`@trading/form/payment-method-select/option/${item.value}`}
        >
            <Row gap={4} width="100%" justifyContent="space-between">
                <Row gap={12} alignItems="start">
                    <PaymentMethodIcon paymentMethod={item.value} />
                    <Column>
                        <Text typographyStyle="body-md">{item.label}</Text>
                        <Text typographyStyle="body-sm" color="contentSecondary">
                            <Translation id="TR_TRADING_RATE" />
                        </Text>
                    </Column>
                </Row>
                {formattedRate && (
                    <Row gap={4} justifyContent="space-between">
                        <Text typographyStyle="body-sm" color="contentSecondary">
                            {formattedRate}
                        </Text>
                    </Row>
                )}
            </Row>
        </CardList.Item>
    );
};

export const PaymentMethodModal = ({ onClose, heading }: PaymentMethodModalProps) => {
    const { paymentMethods, setValue } = useTradingFormContext<TradingTradeBuySellType>();

    const selectPaymentMethod = useCallback(
        (paymentMethod: TradingPaymentMethodListProps) => {
            // setValue is a union type that cannot be called directly, so we need to assert it
            const setValueTyped = setValue as UseFormSetValue<TradingBuySellFormProps>;
            setValueTyped(TRADING_FORM_PAYMENT_METHOD_SELECT, paymentMethod);
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
                {paymentMethods.map(item => (
                    <PaymentMethodModalItem
                        key={item.value}
                        item={item}
                        onSelect={selectPaymentMethod}
                    />
                ))}
            </CardList>
        </Modal>
    );
};
