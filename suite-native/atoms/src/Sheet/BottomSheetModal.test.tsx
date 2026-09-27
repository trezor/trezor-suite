import { createRef } from 'react';
import type * as ReactModule from 'react';
import {
    Dimensions,
    Keyboard,
    type KeyboardEvent,
    type KeyboardEventName,
    type Pressable as NativePressable,
    type View as NativeView,
    Platform,
    StyleSheet,
    Text,
} from 'react-native';

import { type BottomSheetProps } from '@expo/ui/community/bottom-sheet';
import { type BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { act, fireEvent, renderWithBasicProvider, screen } from '@suite-native/test-utils';

import { BottomSheetModal } from './BottomSheetModal';

jest.unmock('./NativeBottomSheetModal');

let mockNativeProps: BottomSheetProps;
const mockPresent = jest.fn();
const mockDismiss = jest.fn();
const mockExpand = jest.fn();

jest.mock('@expo/ui/community/bottom-sheet', () => {
    const { useImperativeHandle, useState } = jest.requireActual<typeof ReactModule>('react');
    const { View } = jest.requireActual<{
        View: typeof NativeView;
        Pressable: typeof NativePressable;
    }>('react-native');

    return {
        BottomSheetModal: (props: BottomSheetProps) => {
            const [isOpen, setIsOpen] = useState(false);
            const [nativeInstance] = useState(() => ({}));
            mockNativeProps = props;

            useImperativeHandle(props.ref, () => ({
                present: () => {
                    mockPresent(nativeInstance);
                    props.onChange?.(0);
                    setIsOpen(true);
                },
                dismiss: mockDismiss,
                close: mockDismiss,
                forceClose: mockDismiss,
                expand: mockExpand,
                collapse: jest.fn(),
                snapToIndex: jest.fn(),
                snapToPosition: jest.fn(),
            }));

            return isOpen ? <View testID="@native-sheet">{props.children}</View> : null;
        },
    };
});

jest.mock('../Button/IconButton', () => {
    const { Pressable } = jest.requireActual<{
        View: typeof NativeView;
        Pressable: typeof NativePressable;
    }>('react-native');

    return { IconButton: Pressable };
});

describe('BottomSheetModal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('uses native presentation while preserving the content, header and footer', async () => {
        const ref = createRef<BottomSheetModalMethods>();
        await renderWithBasicProvider(
            <BottomSheetModal
                ref={ref}
                title="Sheet title"
                footer={<Text>Fixed action</Text>}
                testID="sheet-content"
            >
                <Text>Scrollable content</Text>
            </BottomSheetModal>,
        );

        expect(screen.queryByText('Scrollable content')).not.toBeOnTheScreen();

        await act(() => ref.current?.present());

        expect(mockPresent).toHaveBeenCalledTimes(1);
        expect(screen.getByText('Sheet title')).toBeOnTheScreen();
        expect(screen.getByText('Fixed action')).toBeOnTheScreen();
        expect(screen.getByTestId('sheet-content')).toBeOnTheScreen();
    });

    it('waits for both layout and native presentation before focusing inputs', async () => {
        const ref = createRef<BottomSheetModalMethods>();
        const onChange = jest.fn();
        await renderWithBasicProvider(
            <BottomSheetModal ref={ref} bottomSheetCustomProps={{ onChange }}>
                <Text>Input content</Text>
            </BottomSheetModal>,
        );

        await act(() => ref.current?.present());

        expect(onChange).not.toHaveBeenCalled();

        await fireEvent(screen.getByTestId('@native-sheet/content'), 'layout', {
            nativeEvent: { layout: { width: 400, height: 300, x: 0, y: 0 } },
        });

        expect(onChange).not.toHaveBeenCalled();

        await act(() => mockNativeProps.onDidPresent?.());

        expect(onChange).toHaveBeenCalledWith(0);
    });

    it('also waits for layout when the native presentation callback arrives first', async () => {
        const ref = createRef<BottomSheetModalMethods>();
        const onChange = jest.fn();
        await renderWithBasicProvider(
            <BottomSheetModal ref={ref} bottomSheetCustomProps={{ onChange }}>
                <Text>Input content</Text>
            </BottomSheetModal>,
        );
        await act(() => ref.current?.present());
        await act(() => mockNativeProps.onDidPresent?.());
        expect(onChange).not.toHaveBeenCalled();

        await fireEvent(screen.getByTestId('@native-sheet/content'), 'layout', {
            nativeEvent: { layout: { width: 400, height: 300, x: 0, y: 0 } },
        });
        await act(() => mockNativeProps.onDidPresent?.());

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(0);
    });

    it('closes through a callback ref and invokes dismissal only after the native event', async () => {
        const onClose = jest.fn();
        const onDismiss = jest.fn();
        let modal: BottomSheetModalMethods | null = null;
        await renderWithBasicProvider(
            <BottomSheetModal
                ref={instance => {
                    modal = instance;
                }}
                onClose={onClose}
                onDismiss={onDismiss}
                isCloseDisplayed
            >
                <Text>Content</Text>
            </BottomSheetModal>,
        );
        await act(() => modal?.present());
        await fireEvent(screen.getByTestId('@native-sheet/content'), 'layout', {
            nativeEvent: { layout: { width: 400, height: 300, x: 0, y: 0 } },
        });
        await act(() => mockNativeProps.onDidPresent?.());

        await fireEvent.press(screen.getByTestId('@bottom-sheet/header/close-button'));

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(mockDismiss).toHaveBeenCalledTimes(1);
        expect(onDismiss).not.toHaveBeenCalled();

        await act(() => mockNativeProps.onDismiss?.());

        expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('remounts the closed native presentation before reopening the same sheet', async () => {
        const ref = createRef<BottomSheetModalMethods>();
        await renderWithBasicProvider(
            <BottomSheetModal ref={ref}>
                <Text>Content</Text>
            </BottomSheetModal>,
        );
        const layout = { nativeEvent: { layout: { width: 400, height: 300, x: 0, y: 0 } } };

        await act(() => ref.current?.present());
        await fireEvent(screen.getByTestId('@native-sheet/content'), 'layout', layout);
        await act(() => mockNativeProps.onDidPresent?.());
        await act(() => {
            ref.current?.dismiss();
            ref.current?.present();
        });

        expect(mockPresent).toHaveBeenCalledTimes(1);

        await act(() => mockNativeProps.onDismiss?.());

        expect(mockPresent).toHaveBeenCalledTimes(2);
        expect(mockPresent.mock.calls[1][0]).not.toBe(mockPresent.mock.calls[0][0]);

        await fireEvent(screen.getByTestId('@native-sheet/content'), 'layout', layout);
        await act(() => mockNativeProps.onDidPresent?.());
        await act(() => ref.current?.dismiss());

        expect(mockDismiss).toHaveBeenCalledTimes(2);
    });

    it('does not focus content that is already being replaced by another sheet', async () => {
        const firstRef = createRef<BottomSheetModalMethods>();
        const secondRef = createRef<BottomSheetModalMethods>();
        const onChange = jest.fn();
        await renderWithBasicProvider(
            <>
                <BottomSheetModal ref={firstRef} bottomSheetCustomProps={{ onChange }}>
                    <Text>First content</Text>
                </BottomSheetModal>
                <BottomSheetModal ref={secondRef}>
                    <Text>Replacement content</Text>
                </BottomSheetModal>
            </>,
        );

        await act(() => {
            firstRef.current?.present();
            secondRef.current?.present();
        });
        await fireEvent(screen.getByTestId('@native-sheet/content'), 'layout', {
            nativeEvent: { layout: { width: 400, height: 300, x: 0, y: 0 } },
        });

        await act(() => mockNativeProps.onDidPresent?.());

        expect(mockDismiss).toHaveBeenCalledTimes(1);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('only resizes an active presentation and routes closing snap points through the manager', async () => {
        const ref = createRef<BottomSheetModalMethods>();
        await renderWithBasicProvider(
            <BottomSheetModal ref={ref}>
                <Text>Content</Text>
            </BottomSheetModal>,
        );

        await act(() => ref.current?.expand());
        expect(mockExpand).not.toHaveBeenCalled();

        await act(() => ref.current?.present());
        await fireEvent(screen.getByTestId('@native-sheet/content'), 'layout', {
            nativeEvent: { layout: { width: 400, height: 300, x: 0, y: 0 } },
        });
        await act(() => mockNativeProps.onDidPresent?.());
        await act(() => ref.current?.expand());
        expect(mockExpand).toHaveBeenCalledTimes(1);

        await act(() => ref.current?.snapToIndex(-1));
        expect(mockDismiss).toHaveBeenCalledTimes(1);

        await act(() => ref.current?.expand());
        expect(mockExpand).toHaveBeenCalledTimes(1);
    });
});

describe('BottomSheetModal keyboard layout', () => {
    const originalPlatform = Platform.OS;
    const originalWindow = Dimensions.get('window');
    const originalScreen = Dimensions.get('screen');
    const listeners = new Map<KeyboardEventName, (event: KeyboardEvent) => void>();

    beforeEach(async () => {
        Platform.OS = 'ios';
        listeners.clear();
        jest.spyOn(Keyboard, 'metrics').mockReturnValue(undefined);
        jest.spyOn(Keyboard, 'addListener').mockImplementation((name, listener) => {
            listeners.set(name, listener);

            return { remove: () => listeners.delete(name) };
        });
        await act(() =>
            Dimensions.set({
                window: { ...originalWindow, width: 400, height: 800 },
                screen: { ...originalScreen, width: 900, height: 1400 },
            }),
        );
    });

    afterEach(async () => {
        jest.restoreAllMocks();
        Platform.OS = originalPlatform;
        await act(() => Dimensions.set({ window: originalWindow, screen: originalScreen }));
    });

    const presentSheet = async () => {
        const ref = createRef<BottomSheetModalMethods>();
        await renderWithBasicProvider(
            <BottomSheetModal ref={ref} footer={<Text>Action</Text>}>
                <Text>Form content</Text>
            </BottomSheetModal>,
        );
        await act(() => ref.current?.present());
        const { maxHeight } = StyleSheet.flatten(
            screen.getByTestId('@native-sheet/content').props.style,
        );

        return maxHeight as number;
    };

    const emitKeyboardEvent = (
        name: KeyboardEventName,
        endCoordinates: KeyboardEvent['endCoordinates'],
    ) => act(() => listeners.get(name)?.({ duration: 0, easing: 'keyboard', endCoordinates }));

    it('preserves Android keyboard height updates and hide events', async () => {
        Platform.OS = 'android';
        const maxHeight = await presentSheet();

        await act(() =>
            listeners.get('keyboardDidShow')?.({
                duration: 0,
                easing: 'keyboard',
                endCoordinates: { width: 400, height: 300, screenX: 0, screenY: 500 },
            }),
        );

        expect(screen.getByTestId('@native-sheet/content')).toHaveStyle({
            maxHeight: maxHeight - 300,
        });

        await emitKeyboardEvent('keyboardDidShow', {
            width: 400,
            height: 420,
            screenX: 0,
            screenY: 500,
        });
        expect(screen.getByTestId('@native-sheet/content')).toHaveStyle({
            maxHeight: maxHeight - 420,
        });

        await act(() =>
            listeners.get('keyboardDidHide')?.({
                duration: 0,
                easing: 'keyboard',
                endCoordinates: { width: 400, height: 0, screenX: 0, screenY: 800 },
            }),
        );

        expect(screen.getByTestId('@native-sheet/content')).toHaveStyle({ maxHeight });
    });

    it.each(['keyboardWillChangeFrame', 'keyboardDidChangeFrame'] as const)(
        'resizes an already visible iOS keyboard on %s in window coordinates',
        async eventName => {
            const maxHeight = await presentSheet();
            await emitKeyboardEvent('keyboardDidShow', {
                width: 400,
                height: 300,
                screenX: 0,
                screenY: 500,
            });
            expect(screen.getByTestId('@native-sheet/content')).toHaveStyle({
                maxHeight: maxHeight - 300,
            });

            await emitKeyboardEvent(eventName, {
                width: 400,
                height: 420,
                screenX: 0,
                screenY: 380,
            });
            expect(screen.getByTestId('@native-sheet/content')).toHaveStyle({
                maxHeight: maxHeight - 420,
            });

            await emitKeyboardEvent(eventName, {
                width: 400,
                height: 420,
                screenX: 0,
                screenY: 800,
            });
            expect(screen.getByTestId('@native-sheet/content')).toHaveStyle({ maxHeight });
        },
    );

    it('only reserves the iOS keyboard area that overlaps the current window', async () => {
        const maxHeight = await presentSheet();
        await emitKeyboardEvent('keyboardDidShow', {
            width: 400,
            height: 400,
            screenX: 0,
            screenY: 500,
        });
        expect(screen.getByTestId('@native-sheet/content')).toHaveStyle({
            maxHeight: maxHeight - 300,
        });
    });

    it.each([
        { width: 250, height: 300, screenX: 100, screenY: 500 },
        { width: 400, height: 300, screenX: 0, screenY: 300 },
    ])(
        'does not reserve a bottom inset for a floating iOS keyboard ($width, $screenY)',
        async frame => {
            const maxHeight = await presentSheet();
            await emitKeyboardEvent('keyboardDidShow', frame);
            expect(screen.getByTestId('@native-sheet/content')).toHaveStyle({ maxHeight });
        },
    );
});
