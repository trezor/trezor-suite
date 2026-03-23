import { type ReactNode, useMemo, useState } from 'react';
import { Keyboard } from 'react-native';

import { Translation } from '@suite-native/intl';

import { Box } from '../Box';
import { Button } from '../Button/Button';
import { ScreenFooterGradient } from '../ScreenFooterGradient';
import { BottomSheetModal } from '../Sheet/BottomSheetModal';
import { useBottomSheetModal } from '../Sheet/hooks/useBottomSheetModal';
import { VStack } from '../Stack';
import { SelectItem, type SelectItemValue } from './SelectItem';
import { SelectTrigger } from './SelectTrigger';

export type SelectItemType<TItemValue extends SelectItemValue> = {
    value: TItemValue;
    label: string;
    icon?: ReactNode;
    badge?: ReactNode;
};

export type SelectProps<TItemValue extends SelectItemValue> = {
    title: ReactNode;
    items: SelectItemType<TItemValue>[];
    value: TItemValue;
    onSelectItem: (value: TItemValue) => void;
    isConfirmable?: boolean;
    isLabelShown?: boolean;
    testID?: string;
};

export const Select = <TItemValue extends SelectItemValue>({
    title,
    items,
    value,
    onSelectItem,
    isConfirmable = false,
    isLabelShown = false,
    testID,
}: SelectProps<TItemValue>) => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const selectTriggerItem = useMemo(
        () => items.find(item => item.value === value),
        [items, value],
    );

    const [selectedItemValue, setSelectedItemValue] = useState(value);
    const [isConfirmButtonVisible, setIsConfirmButtonVisible] = useState(false);

    const openBottomSheet = () => {
        Keyboard.dismiss();
        setSelectedItemValue(value);
        setIsConfirmButtonVisible(false);
        openModal();
    };

    const confirmSelection = (itemValue: TItemValue) => {
        onSelectItem(itemValue);
        closeModal();
    };

    const handleSelectItem = (itemValue: TItemValue) => {
        if (isConfirmable) {
            setSelectedItemValue(itemValue);
            setIsConfirmButtonVisible(itemValue !== value);
        } else {
            confirmSelection(itemValue);
        }
    };

    return (
        <>
            <BottomSheetModal
                ref={bottomSheetRef}
                title={title}
                footer={
                    isConfirmButtonVisible && (
                        <>
                            <ScreenFooterGradient />
                            <Box marginHorizontal="sp16" marginBottom="sp16">
                                <Button onPress={() => confirmSelection(selectedItemValue)}>
                                    <Translation id="generic.buttons.confirm" />
                                </Button>
                            </Box>
                        </>
                    )
                }
                isCloseDisplayed
            >
                <VStack spacing="sp12">
                    {items.map(({ value: itemValue, label, icon, badge }) => (
                        <SelectItem
                            key={itemValue}
                            label={label}
                            value={itemValue}
                            isSelected={itemValue === selectedItemValue}
                            onSelect={() => handleSelectItem(itemValue)}
                            icon={icon}
                            badge={badge}
                        />
                    ))}
                </VStack>
            </BottomSheetModal>
            <SelectTrigger
                label={isLabelShown && title}
                value={selectTriggerItem?.label ?? null}
                icon={selectTriggerItem?.icon}
                handlePress={openBottomSheet}
                testID={testID}
            />
        </>
    );
};
