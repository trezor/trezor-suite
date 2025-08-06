import { ReactNode, useMemo } from 'react';

import { SelectItem, SelectItemValue } from './SelectItem';
import { SelectTrigger } from './SelectTrigger';
import { BottomSheetModal } from '../Sheet/BottomSheetModal';
import { useBottomSheetModal } from '../Sheet/hooks/useBottomSheetModal';

export type SelectItemType<TItemValue extends SelectItemValue> = {
    value: TItemValue;
    label: string;
};

type SelectProps<TItemValue extends SelectItemValue> = {
    items: SelectItemType<TItemValue>[];
    selectValue: SelectItemValue;
    onSelectItem: (value: TItemValue) => void;
    selectLabel?: ReactNode;
    testID?: string;
};

export const Select = <TItemValue extends SelectItemValue>({
    items,
    selectLabel,
    selectValue,
    onSelectItem,
    testID,
}: SelectProps<TItemValue>) => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const selectedItem = useMemo(
        () => items.find(item => item.value === selectValue),
        [selectValue, items],
    );
    const handleSelectItem = (itemValue: TItemValue) => {
        onSelectItem(itemValue);
        closeModal();
    };

    return (
        <>
            <BottomSheetModal ref={bottomSheetRef} title={selectLabel} isCloseDisplayed>
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
            </BottomSheetModal>
            <SelectTrigger
                value={selectedItem?.label ?? null}
                handlePress={openModal}
                testID={testID}
            />
        </>
    );
};
