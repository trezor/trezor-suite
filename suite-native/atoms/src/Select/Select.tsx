import { useMemo, useState, ReactNode } from 'react';

import { BottomSheet } from '../Sheet/BottomSheet';
import { SelectItemValue, SelectItem } from './SelectItem';
import { SelectTrigger } from './SelectTrigger';

export type SelectItemType<TItemValue extends SelectItemValue> = {
    value: TItemValue;
    label: string;
};

type SelectProps<TItemValue extends SelectItemValue> = {
    items: SelectItemType<TItemValue>[];
    selectValue: SelectItemValue;
    onSelectItem: (value: TItemValue) => void;
    selectLabel: ReactNode;
};

export const Select = <TItemValue extends SelectItemValue>({
    items,
    selectLabel,
    selectValue,
    onSelectItem,
}: SelectProps<TItemValue>) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const selectedItem = useMemo(
        () => items.find(item => item.value === selectValue),
        [selectValue, items],
    );
    const handleSelectItem = (itemValue: TItemValue) => {
        onSelectItem(itemValue);
        setIsOpen(false);
    };

    return (
        <>
            <BottomSheet isVisible={isOpen} onClose={setIsOpen} title={selectLabel}>
                {items.map(({ value, label }, index) => (
                    <SelectItem
                        key={value}
                        label={label}
                        value={value}
                        isSelected={value === selectedItem?.value}
                        isLastChild={index === items.length - 1}
                        onSelect={() => handleSelectItem(value)}
                    />
                ))}
            </BottomSheet>
            <SelectTrigger
                value={selectedItem?.label ?? null}
                label={selectLabel}
                handlePress={() => setIsOpen(true)}
            />
        </>
    );
};
