import { useState } from 'react';

import { getFiatCurrencyFlag } from '@suite-common/flags';
import { Button, Flag, Row } from '@trezor/components';
import { CaretDownIcon } from '@trezor/icons';

import { CurrencyPickerModal } from './CurrencyPickerModal';
import { type CurrencyPickerOption } from './types/currencyPickerTypes';

type CurrencyPickerProps = {
    value: CurrencyPickerOption;
    options: CurrencyPickerOption[];
    onSelect: (currency: CurrencyPickerOption) => void;
    isDisabled?: boolean;
    isLoading?: boolean;
    dataTestId?: string;
};

export const CurrencyPicker = ({
    value,
    options,
    isDisabled,
    isLoading,
    onSelect,
    dataTestId = '@trading/form/currency-picker/input',
}: CurrencyPickerProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const flag = getFiatCurrencyFlag(value.value);

    const handleCurrencySelect = (currency: CurrencyPickerOption) => {
        onSelect(currency);
        setIsModalOpen(false);
    };

    return (
        <>
            <Button
                intent="neutral"
                priority="secondary"
                iconRight={CaretDownIcon}
                isDisabled={isDisabled}
                isLoading={isLoading}
                onClick={() => setIsModalOpen(true)}
                flex="0 0 auto"
                data-testid={dataTestId}
            >
                <Row gap={8} alignItems="center">
                    {!!flag && <Flag country={flag} size={20} />}
                    {value.shortLabel}
                </Row>
            </Button>
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
