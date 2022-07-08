import React, { ReactNode, useMemo, useState } from 'react';

import {
    CryptoIcon,
    CryptoIconName,
    FlagIcon,
    FlagIconName,
    isCryptoIconType,
    isFlagIconType,
} from '@trezor/icons';

import { BottomModal } from '../Modal/BottomModal';
import { SelectTrigger } from './SelectTrigger';
import { SelectItem, SelectValue } from './SelectItem';

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
};

export const Select = ({ items, selectLabel, value, onSelectItem }: SelectProps) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const selectedItem = useMemo(() => items.find(item => item.value === value), [value, items]);

    const handleSelectItem = (value: SelectValue) => {
        onSelectItem(value);
        setIsOpen(false);
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
                <BottomModal
                    isVisible={isOpen}
                    onVisibilityChange={setIsOpen}
                    title={selectLabel}
                    onBackArrowClick={() => setIsOpen(false)}
                >
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
                </BottomModal>
            )}
            <SelectTrigger
                icon={getIcon(selectedItem?.iconName)}
                value={selectedItem?.label ?? null}
                label={selectLabel}
                handlePress={() => setIsOpen(true)}
            />
        </>
    );
};
