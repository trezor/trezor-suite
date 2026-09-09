import { type ReactNode, useMemo, useState } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Translation } from '@suite-native/intl';

import { Box } from '../Box';
import { Button } from '../Button/Button';
import { Hint } from '../Hint';
import { type TextInputType } from '../Input/Input';
import { ScreenFooterGradient } from '../ScreenFooterGradient';
import { BottomSheetModal } from '../Sheet/BottomSheetModal';
import { useBottomSheetModal } from '../Sheet/hooks/useBottomSheetModal';
import { VStack } from '../Stack';
import { Text } from '../Text';
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
    value: TItemValue | null;
    onSelectItem: (value: TItemValue) => void;
    isConfirmable?: boolean;
    labelType?: TextInputType;
    hasError?: boolean;
    errorMessage?: string;
    isDisabled?: boolean;
    testID?: string;
};

export const Select = <TItemValue extends SelectItemValue>({
    title,
    items,
    value,
    onSelectItem,
    isConfirmable = false,
    labelType = 'noLabel',
    hasError = false,
    errorMessage,
    isDisabled = false,
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
        if (isDisabled) return;
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

    const handleConfirmSelection = () => {
        if (selectedItemValue !== null) {
            confirmSelection(selectedItemValue);
        }
    };

    const triggerLabel = labelType === 'innerLabel' ? title : undefined;

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
                                <Button onPress={handleConfirmSelection}>
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
            <VStack spacing="sp6">
                {labelType === 'outsideLabel' && (
                    <Text variant="body-md" color="contentPrimary">
                        {title}
                    </Text>
                )}
                <SelectTrigger
                    labelType={labelType}
                    label={triggerLabel}
                    value={selectTriggerItem?.label ?? null}
                    icon={selectTriggerItem?.icon}
                    handlePress={openBottomSheet}
                    hasError={hasError}
                    isDisabled={isDisabled}
                    testID={testID}
                />
                {hasError && !!errorMessage && (
                    <Animated.View entering={FadeIn} exiting={FadeOut}>
                        <Box marginLeft="sp12">
                            <Hint variant="error">{errorMessage}</Hint>
                        </Box>
                    </Animated.View>
                )}
            </VStack>
        </>
    );
};
