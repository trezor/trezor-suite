import React, { ReactNode, useState } from 'react';

import { CryptoIcon, CryptoIconName, FlagIcon, FlagIconName } from '@trezor/icons';

import { isCryptoIconType, isFlagIconType, SelectItem as TSelectItem } from './selectTypes';

import { BottomModal } from '../Modal/BottomModal';
import { SelectTrigger } from './SelectTrigger';
import { SelectItem } from './SelectItem';

// TODO: Temporary workaround because I need to import this type in DemoScreen.tsx
// Alternative would be to `export {SelectItem} from './selectTypes' in index.ts`
// Delete this when form package is set up and this will then be imported there from selectTypes file
export type SelectItemType = TSelectItem;

type SelectProps = {
    items: SelectItemType[];
    label: string;
    selectedItem: SelectItemType | null;
    setSelectedItem: (item: SelectItemType | null) => void;
};

export const Select = ({ items, label, selectedItem, setSelectedItem }: SelectProps) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const handleSelectItem = (value: string) => {
        setSelectedItem(items.find(item => item.value === value) ?? null);
        setIsOpen(false);
    };

    const getIcon = (iconName?: CryptoIconName | FlagIconName): ReactNode => {
        if (!iconName) return null;
        if (isCryptoIconType(iconName)) return <CryptoIcon name={iconName} />;
        if (isFlagIconType(iconName)) return <FlagIcon name={iconName} />;
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
                            icon={getIcon(iconName)}
                            isSelected={value === selectedItem?.value}
                            isLastChild={index === items.length - 1}
                            onSelect={() => handleSelectItem(value)}
                        />
                    ))}
                </BottomModal>
            )}
            <SelectTrigger
                label={label}
                icon={getIcon(selectedItem?.iconName)}
                selectedItem={selectedItem ?? null}
                handlePress={() => setIsOpen(true)}
            />
        </>
    );
};
