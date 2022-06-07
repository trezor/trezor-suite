import React, { ReactNode, useState } from 'react';

import { CryptoIcon, CryptoIconName, FlagIcon, FlagIconName } from '@trezor/icons';

import { isCryptoIconType, isFlagIconType } from './selectTypes';

import { BottomModal } from '../Modal/BottomModal';
import { SelectTrigger } from './SelectTrigger';
import { SelectItem } from './SelectItem';

export type SelectItem = {
    label: string;
    value: string;
    iconName?: FlagIconName;
};

type SelectProps = {
    items: SelectItem[];
    label: string;
    selectedItem: SelectItem | null;
    setSelectedItem: (item: SelectItem | null) => void;
};

export const Select = ({ items, label, selectedItem, setSelectedItem }: SelectProps) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const handleSelectItem = (value: string) => {
        setSelectedItem(items.find(item => item.value === value) ?? null);
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
                    title="Typography Demo"
                    hasBackArrow
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
                value={selectedItem?.value ?? null}
                label={selectedItem?.label ?? label}
                handlePress={() => setIsOpen(true)}
            />
        </>
    );
};
