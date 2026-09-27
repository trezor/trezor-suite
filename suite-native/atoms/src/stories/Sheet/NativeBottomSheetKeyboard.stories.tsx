/* eslint-disable jsx-a11y/no-autofocus -- This story checks automatic keyboard focus in a native sheet. */
import { useEffect, useRef, useState } from 'react';
import { Keyboard as NativeKeyboard } from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-controller';

import type { Meta, StoryObj } from '@storybook/react-native';

import { Box } from '../../Box';
import { Button } from '../../Button/Button';
import { CheckBox } from '../../CheckBox';
import { Input, type InputType } from '../../Input/Input';
import { BottomSheetModal } from '../../Sheet/BottomSheetModal';
import { useBottomSheetModal } from '../../Sheet/hooks/useBottomSheetModal';
import { HStack, VStack } from '../../Stack';
import { Text } from '../../Text';

type KeyboardSheetProps = {
    isContentLong: boolean;
    focusBehavior: 'onChange' | 'autoFocus' | 'manual';
};

const KeyboardSheet = ({ isContentLong, focusBehavior }: KeyboardSheetProps) => {
    const [value, setValue] = useState('');
    const [note, setNote] = useState('');
    const [pressCount, setPressCount] = useState(0);
    const [dismissCount, setDismissCount] = useState(0);
    const [isChecked, setIsChecked] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(NativeKeyboard.metrics()?.height ?? 0);
    const controllerKeyboardHeight = useKeyboardState(state => state.height);
    const inputRef = useRef<InputType>(null);
    const noteRef = useRef<InputType>(null);
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    useEffect(() => {
        const updateKeyboardHeight = () => setKeyboardHeight(NativeKeyboard.metrics()?.height ?? 0);
        const showSubscription = NativeKeyboard.addListener(
            'keyboardDidShow',
            updateKeyboardHeight,
        );
        const hideSubscription = NativeKeyboard.addListener(
            'keyboardDidHide',
            updateKeyboardHeight,
        );

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    return (
        <VStack spacing="sp16">
            <Button onPress={openModal} testID="@native-sheet-qa/open">
                Open keyboard sheet
            </Button>
            <Text testID="@native-sheet-qa/dismiss-count">Dismissed: {dismissCount}</Text>
            <BottomSheetModal
                ref={bottomSheetRef}
                title="Keyboard test"
                subtitle="Local test values only"
                isCloseDisplayed
                onDismiss={() => setDismissCount(count => count + 1)}
                bottomSheetCustomProps={{
                    onChange: index => {
                        if (index >= 0 && focusBehavior === 'onChange') inputRef.current?.focus();
                    },
                }}
                footer={
                    <Box marginHorizontal="sp16" marginBottom="sp16">
                        <Button
                            onPress={() => setPressCount(count => count + 1)}
                            testID="@native-sheet-qa/footer"
                        >
                            Footer presses: {pressCount}
                        </Button>
                    </Box>
                }
            >
                <VStack spacing="sp16">
                    <Text>
                        Keyboard height: {keyboardHeight}; controller: {controllerKeyboardHeight}
                    </Text>
                    <Input
                        ref={inputRef}
                        label="Test name"
                        value={value}
                        onChangeText={setValue}
                        asBottomSheetInput
                        autoFocus={focusBehavior === 'autoFocus'}
                        autoCorrect={false}
                        autoCapitalize="none"
                        returnKeyType="next"
                        submitBehavior="submit"
                        onSubmitEditing={() => noteRef.current?.focus()}
                        testID="@native-sheet-qa/input"
                    />
                    {isContentLong &&
                        Array.from({ length: 12 }, (_, index) => (
                            <Text key={index}>Scrollable content row {index + 1}</Text>
                        ))}
                    <Input
                        ref={noteRef}
                        label="Test note"
                        value={note}
                        onChangeText={setNote}
                        asBottomSheetInput
                        multiline
                        numberOfLines={3}
                        testID="@native-sheet-qa/note"
                    />
                    <HStack spacing="sp12" alignItems="center">
                        <CheckBox
                            isChecked={isChecked}
                            onChange={setIsChecked}
                            accessibilityLabel="Test checkbox"
                            testID="@native-sheet-qa/checkbox"
                        />
                        <Text>Checkbox: {isChecked ? 'checked' : 'unchecked'}</Text>
                    </HStack>
                    <Button
                        onPress={() => {
                            setValue('');
                            setNote('');
                        }}
                        testID="@native-sheet-qa/reset"
                    >
                        Reset fields
                    </Button>
                    <Button onPress={closeModal} testID="@native-sheet-qa/close">
                        Close sheet
                    </Button>
                </VStack>
            </BottomSheetModal>
        </VStack>
    );
};

const meta: Meta<KeyboardSheetProps> = {
    title: 'Atoms/Native sheet QA',
    component: KeyboardSheet,
    argTypes: {
        focusBehavior: {
            control: { type: 'select' },
            options: ['onChange', 'autoFocus', 'manual'],
        },
    },
};

export default meta;

export const Keyboard: StoryObj<KeyboardSheetProps> = {
    args: { isContentLong: false, focusBehavior: 'onChange' },
};

export const ScrollableKeyboard: StoryObj<KeyboardSheetProps> = {
    args: { isContentLong: true, focusBehavior: 'onChange' },
};

export const AutomaticFocus: StoryObj<KeyboardSheetProps> = {
    args: { isContentLong: false, focusBehavior: 'autoFocus' },
};

export const ManualFocus: StoryObj<KeyboardSheetProps> = {
    args: { isContentLong: false, focusBehavior: 'manual' },
};
