import React, { ReactNode, useMemo, useState, useRef } from 'react';

import {
    CryptoIcon,
    CryptoIconName,
    FlagIcon,
    FlagIconName,
    isCryptoIconType,
    isFlagIconType,
} from '@trezor/icons';

import { BottomSheet } from '../Sheet/BottomSheet';
import { SelectItem, SelectValue } from './SelectItem';
import { SelectTrigger } from './SelectTrigger';

export type SelectItemType = {
    label: string;
    value: SelectValue;
    iconName?: FlagIconName | CryptoIconName;
};

type SelectProps = {
    items: SelectItemType[];
    selectLabel: string;
    value: SelectValue;
    onSelectItem: (value: SelectValue) => void;
    valueLabel?: string;
};

export const Select = ({ items, selectLabel, value, valueLabel, onSelectItem }: SelectProps) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const selectedItem = useMemo(() => items.find(item => item.value === value), [value, items]);
    const bottomSheetRef = useRef(null);
    const handleSelectItem = (value: SelectValue) => {
        onSelectItem(value);
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
                <BottomSheet
                    isVisible={isOpen}
                    onVisibilityChange={setIsOpen}
                    title={selectLabel}
                    ref={bottomSheetRef}
                >
                    {items.map(({ value, label, iconName }, index) => (
                        <SelectItem
                            key={value}
                            label={label}
                            value={value}
                            icon={getIcon(iconName, true)}
                            isSelected={value === selectedItem?.value}
                            isLastChild={index === items.length - 1}
                            onSelect={() => {
                                handleSelectItem(value);
                                bottomSheetRef.current.close();
                            }}
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
