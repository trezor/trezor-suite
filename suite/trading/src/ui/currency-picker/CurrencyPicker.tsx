import { useState } from 'react';

import { CurrencyPickerModal } from './CurrencyPickerModal';
import { FakeSelect, type FakeSelectProps } from '../Form/FakeSelect';
import { type CurrencyPickerOption } from './types/currencyPickerTypes';

type CurrencyPickerProps = Omit<FakeSelectProps, 'onClick' | 'value'> & {
    value: CurrencyPickerOption;
    options: CurrencyPickerOption[];
    onSelect: (currency: CurrencyPickerOption) => void;
    dataTestId?: string;
};

export const CurrencyPicker = ({
    value,
    options,
    isDisabled,
    isLoading,
    onSelect,
    dataTestId = '@trading/form/currency-picker/input',
    ...props
}: CurrencyPickerProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCurrencySelect = (currency: CurrencyPickerOption) => {
        onSelect(currency);
        setIsModalOpen(false);
    };

    return (
        <>
            <FakeSelect
                {...props}
                value={value.shortLabel}
                isDisabled={isDisabled}
                isLoading={isLoading}
                onClick={() => setIsModalOpen(true)}
                size="small"
                data-testid={dataTestId}
            />
            {isModalOpen && (
                <CurrencyPickerModal
                    onCancel={() => setIsModalOpen(false)}
                    onCurrencySelect={handleCurrencySelect}
                    options={options}
                />
            )}
        </>
    );
};
