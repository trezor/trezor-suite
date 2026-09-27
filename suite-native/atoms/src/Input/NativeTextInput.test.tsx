import { type ComponentProps, type ComponentType, useRef as mockUseRef } from 'react';
import { Text as MockText, View as MockView } from 'react-native';

import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { NativeTextInput as AndroidInput } from './NativeTextInput.android';
import { NativeTextInput as IOSInput } from './NativeTextInput.ios';
import { type NativeTextInputProps } from './nativeTextInputTypes';

const mockUseNativeState = (value: string) =>
    mockUseRef({ set: jest.fn(), initialValue: value }).current;

jest.unmock('./NativeTextInput');

jest.mock('@expo/ui/swift-ui', () => ({
    Host: MockView,
    VStack: MockView,
    Text: MockText,
    TextField: MockView,
    useNativeState: (value: string) => mockUseNativeState(value),
}));

jest.mock('@expo/ui/jetpack-compose', () => ({
    Host: MockView,
    Text: MockText,
    OutlinedTextField: Object.assign(
        (props: ComponentProps<typeof MockView> & { modifiers?: { testID?: string }[] }) => (
            <MockView
                {...props}
                testID={props.modifiers?.find(modifier => modifier.testID)?.testID}
            />
        ),
        { Label: MockView, Placeholder: MockView },
    ),
    useNativeState: (value: string) => mockUseNativeState(value),
}));

type InputPlatform = {
    platform: 'ios' | 'android';
    Component: ComponentType<NativeTextInputProps>;
};

describe.each<InputPlatform>([
    { platform: 'ios', Component: IOSInput },
    { platform: 'android', Component: AndroidInput },
])('NativeTextInput on $platform', ({ platform, Component }) => {
    const renderInput = (props: Partial<NativeTextInputProps> = {}) =>
        renderWithBasicProvider(
            <Component
                label="Server URL"
                value="https://initial.example"
                testID="input"
                {...props}
            />,
        );

    it('uses native state for initial text and does not echo typing back into the native buffer', async () => {
        const onChangeText = jest.fn();
        const { getByTestId, rerender } = await renderInput({ onChangeText });
        const input = getByTestId('input');
        const state = input.props[platform === 'ios' ? 'text' : 'value'];

        expect(state.initialValue).toBe('https://initial.example');
        await fireEvent(
            input,
            platform === 'ios' ? 'textChange' : 'valueChange',
            'https://edited.example',
        );
        expect(onChangeText).toHaveBeenCalledTimes(1);
        expect(onChangeText).toHaveBeenCalledWith('https://edited.example');

        await rerender(
            <Component
                label="Server URL"
                value="https://edited.example"
                testID="input"
                onChangeText={onChangeText}
            />,
        );
        expect(state.set).not.toHaveBeenCalled();

        await rerender(
            <Component
                label="Server URL"
                value="https://reset.example"
                testID="input"
                onChangeText={onChangeText}
            />,
        );
        expect(state.set).toHaveBeenCalledTimes(1);
        expect(state.set).toHaveBeenCalledWith('https://reset.example');
        expect(onChangeText).toHaveBeenCalledTimes(1);
    });

    it('reports real focus transitions without treating the initial native blur as touched', async () => {
        const onFocus = jest.fn();
        const onBlur = jest.fn();
        const { getByTestId } = await renderInput({ onFocus, onBlur });
        const input = getByTestId('input');
        const event = platform === 'ios' ? 'focusChange' : 'focusChanged';

        await fireEvent(input, event, false);
        expect(onBlur).not.toHaveBeenCalled();
        await fireEvent(input, event, true);
        await fireEvent(input, event, true);
        await fireEvent(input, event, false);
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('configures a single-line URL keyboard without spelling or capitalization', async () => {
        const { getByTestId, getByText } = await renderInput({
            keyboardType: 'url',
            autoCapitalize: 'none',
            autoCorrect: false,
        });
        const input = getByTestId('input');

        expect(getByText('Server URL')).toBeOnTheScreen();
        if (platform === 'ios') {
            expect(input.props.axis).toBe('horizontal');
            expect(input.props.modifiers).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ $type: 'keyboardType', keyboardType: 'url' }),
                    expect.objectContaining({ $type: 'autocorrectionDisabled', disabled: true }),
                    expect.objectContaining({
                        $type: 'textInputAutocapitalization',
                        autocapitalization: 'never',
                    }),
                    expect.objectContaining({ $type: 'accessibilityLabel', label: 'Server URL' }),
                ]),
            );
        } else {
            expect(input.props.singleLine).toBe(true);
            expect(input.props.keyboardOptions).toMatchObject({
                keyboardType: 'uri',
                capitalization: 'none',
                autoCorrectEnabled: false,
            });
        }
    });

    it('passes disabled state and native character limits to the control', async () => {
        const { getByTestId } = await renderInput({ editable: false, maxLength: 32 });
        const input = getByTestId('input');

        expect(input.props.maxLength).toBe(32);
        if (platform === 'ios') {
            expect(input.props.modifiers).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ $type: 'disabled', disabled: true }),
                ]),
            );
        } else {
            expect(input.props.enabled).toBe(false);
        }
    });
});
