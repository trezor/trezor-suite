import { useState } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import {
    type TradingPaymentMethodListProps,
    type TradingPaymentMethodProps,
} from '@suite-common/trading';
import { CardList, Modal, Row } from '@trezor/components';

import { PaymentMethodIcon } from '../../ui/payment-methods/PaymentMethodIcon';
import { FormSelectRow } from '../FormSelectRow/FormSelectRow';

export type PaymentMethodSelectValue = TradingPaymentMethodProps;

type PaymentMethodSelectProps = {
    value: PaymentMethodSelectValue;
    onChange: (paymentMethod: PaymentMethodSelectValue) => void;
    options: TradingPaymentMethodListProps[];
    label: TranslationKey;
};

export const PaymentMethodSelect = ({
    value,
    onChange,
    options,
    label,
}: PaymentMethodSelectProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const selectedOption = options.find(option => option.value === value);
    const hasOptions = options.length > 0;

    const handleSelect = (paymentMethod: PaymentMethodSelectValue) => {
        onChange(paymentMethod);
        setIsModalOpen(false);
    };

    return (
        <>
            <FormSelectRow
                label={<Translation id={label} />}
                onClick={() => setIsModalOpen(true)}
                isDisabled={!hasOptions}
                data-testid="@trading/form/payment-method-select"
            >
                {!!selectedOption && (
                    <Row gap={8} alignItems="center">
                        <PaymentMethodIcon paymentMethod={selectedOption.value} size={20} />
                        {selectedOption.label}
                    </Row>
                )}
                {!hasOptions && <Translation id="TR_TRADING_NO_METHODS_AVAILABLE" />}
            </FormSelectRow>
            {isModalOpen && (
                <Modal
                    width={480}
                    onCancel={() => setIsModalOpen(false)}
                    heading={<Translation id={label} />}
                >
                    <CardList>
                        {options.map(option => (
                            <CardList.Item
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                data-testid={`@trading/form/payment-method-select/option/${option.value}`}
                            >
                                <Row gap={16} alignItems="center">
                                    <PaymentMethodIcon paymentMethod={option.value} />
                                    {option.label}
                                </Row>
                            </CardList.Item>
                        ))}
                    </CardList>
                </Modal>
            )}
        </>
    );
};
