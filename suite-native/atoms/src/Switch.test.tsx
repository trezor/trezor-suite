import { type PropsWithChildren } from 'react';
import { View as MockView } from 'react-native';

import { type SwitchProps as ComposeSwitchProps } from '@expo/ui/jetpack-compose';
import { type ToggleProps } from '@expo/ui/swift-ui';

import { act, renderWithBasicProvider } from '@suite-native/test-utils';

import { Switch as AndroidSwitch } from './Switch.android';
import { Switch as IOSSwitch } from './Switch.ios';

jest.mock('@expo/ui/swift-ui', () => ({
    Host: ({ children }: PropsWithChildren) => children,
    Toggle: (props: ToggleProps) => (
        <MockView {...props} testID={props.testID ?? 'native-control'} />
    ),
}));

jest.mock('@expo/ui/jetpack-compose', () => ({
    Host: ({ children }: PropsWithChildren) => children,
    Switch: (props: ComposeSwitchProps) => <MockView {...props} testID="native-control" />,
}));

describe.each([
    {
        platform: 'iOS',
        Component: IOSSwitch,
        valueProp: 'isOn',
        changeProp: 'onIsOnChange',
    },
    {
        platform: 'Android',
        Component: AndroidSwitch,
        valueProp: 'value',
        changeProp: 'onCheckedChange',
    },
])('$platform Switch', ({ Component, valueProp, changeProp }) => {
    it('keeps its controlled value until the parent accepts a native change', async () => {
        const onChange = jest.fn();
        const { getByTestId, rerender } = await renderWithBasicProvider(
            <Component isChecked={false} onChange={onChange} />,
        );

        await act(() => getByTestId('native-control').props[changeProp](true));

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(true);
        expect(getByTestId('native-control').props[valueProp]).toBe(false);

        await rerender(<Component isChecked onChange={onChange} />);

        expect(getByTestId('native-control').props[valueProp]).toBe(true);

        await act(() => getByTestId('native-control').props[changeProp](false));

        expect(onChange).toHaveBeenLastCalledWith(false);
    });

    it('ignores native changes after it is disabled', async () => {
        const onChange = jest.fn();
        const { getByTestId } = await renderWithBasicProvider(
            <Component isChecked={false} isDisabled onChange={onChange} />,
        );

        await act(() => getByTestId('native-control').props[changeProp](true));

        expect(onChange).not.toHaveBeenCalled();
    });
});

describe('native Switch configuration', () => {
    it('exposes the iOS disabled state to SwiftUI', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <IOSSwitch
                isChecked
                isDisabled
                onChange={jest.fn()}
                testID="switch"
                accessibilityLabel="Example control"
            />,
        );

        expect(getByTestId('switch').props).toEqual(
            expect.objectContaining({
                modifiers: expect.arrayContaining([
                    { $type: 'disabled', disabled: true },
                    { $type: 'accessibilityLabel', label: 'Example control' },
                ]),
            }),
        );
    });

    it('exposes the Android disabled state and test identifier to Compose', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <AndroidSwitch isChecked isDisabled onChange={jest.fn()} testID="switch" />,
        );

        expect(getByTestId('native-control').props).toEqual(
            expect.objectContaining({
                enabled: false,
                modifiers: expect.arrayContaining([{ $type: 'testID', testID: 'switch' }]),
            }),
        );
    });
});
