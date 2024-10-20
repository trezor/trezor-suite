import { useMemo, useState, ReactNode } from 'react';

import { CryptoIcon, CoinSymbolName } from '@suite-native/icons';

import { BottomSheet } from '../Sheet/BottomSheet';
import { SelectItemValue, SelectItem } from './SelectItem';
import { SelectTrigger } from './SelectTrigger';

export type SelectItemType<TItemValue extends SelectItemValue> = {
    value: TItemValue;
    label: string;
};

export type SelectItemExtendedType<TItemValue extends SelectItemValue> =
    SelectItemType<TItemValue> & {
        iconName?: CoinSymbolName;
    };

type SelectProps<TItemValue extends SelectItemValue> = {
    items: SelectItemExtendedType<TItemValue>[];
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

    const getIcon = (iconName?: CoinSymbolName, isSelectItem = false): ReactNode => {
        if (!iconName) return null;

        return <CryptoIcon size={isSelectItem ? 'small' : 'extraSmall'} symbol={iconName} />;
    };

    return (
        <>
            <BottomSheet isVisible={isOpen} onClose={setIsOpen} title={selectLabel}>
                {items.map(({ value, label, iconName }, index) => (
                    <SelectItem
                        key={value}
                        label={label}
                        value={value}
                        icon={getIcon(iconName, true)}
                        isSelected={value === selectedItem?.value}
                        isLastChild={index === items.length - 1}
                        onSelect={() => handleSelectItem(value)}
                    />
                ))}
            </BottomSheet>
            <SelectTrigger
                icon={getIcon(selectedItem?.iconName)}
                value={selectedItem?.label ?? null}
                label={selectLabel}
                handlePress={() => setIsOpen(true)}
            />
        </>
    );
};
