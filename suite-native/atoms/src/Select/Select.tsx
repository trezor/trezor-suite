import React, { ReactNode, useMemo, useState } from 'react';

import {
    CryptoIcon,
    CryptoIconName,
    FlagIcon,
    FlagIconName,
    isCryptoIconType,
    isFlagIconType,
} from '@trezor/icons';

import { BottomSheet } from '../Sheet/BottomSheet';
import { SelectItemValue, SelectItem } from './SelectItem';
import { SelectTrigger } from './SelectTrigger';

export type SelectItemType<TItemValue extends SelectItemValue> = {
    value: TItemValue;
    label: string;
};

export type SelectItemExtendedType<TItemValue extends SelectItemValue> =
    SelectItemType<TItemValue> & {
        iconName?: FlagIconName | CryptoIconName;
    };

type SelectProps<TItemValue extends SelectItemValue> = {
    items: SelectItemExtendedType<TItemValue>[];
    selectValue: SelectItemValue;
    onSelectItem: (value: TItemValue) => void;
    valueLabel?: string;
    selectLabel: string;
};

export const Select = <TItemValue extends SelectItemValue>({
    items,
    selectLabel,
    selectValue,
    valueLabel,
    onSelectItem,
}: SelectProps<TItemValue>) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const selectedItem = useMemo(
        () => items.find(item => item.value === selectValue),
        [selectValue, items],
    );
    const handleSelectItem = (itemValue: TItemValue) => {
        onSelectItem(itemValue);
    };

    const getIcon = (iconName?: CryptoIconName | FlagIconName, isSelectItem = false): ReactNode => {
        if (!iconName) return null;
        if (isCryptoIconType(iconName)) {
            return <CryptoIcon size={isSelectItem ? 'small' : 'extraSmall'} name={iconName} />;
        }
        if (isFlagIconType(iconName)) {
            return <FlagIcon size={isSelectItem ? 'small' : 'extraSmall'} name={iconName} />;
        }
    };

    return (
        <>
            {isOpen && (
                <BottomSheet isVisible={isOpen} onVisibilityChange={setIsOpen} title={selectLabel}>
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
            )}
            <SelectTrigger
                icon={getIcon(selectedItem?.iconName)}
                value={selectedItem?.label ?? null}
                label={selectLabel}
                valueLabel={valueLabel}
                handlePress={() => setIsOpen(true)}
            />
        </>
    );
};
