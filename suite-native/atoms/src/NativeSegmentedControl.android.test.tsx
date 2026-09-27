import { type PropsWithChildren } from 'react';
import { Text as MockText, View as MockView } from 'react-native';

import {
    type SegmentedButtonProps,
    type SingleChoiceSegmentedButtonRowProps,
} from '@expo/ui/jetpack-compose';

import { act, renderWithBasicProvider } from '@suite-native/test-utils';

import { NativeSegmentedControl } from './NativeSegmentedControl.android';

jest.mock('@expo/ui/jetpack-compose', () => {
    const getTestID = (modifiers: SegmentedButtonProps['modifiers']) => {
        const testID = modifiers?.find(modifier => modifier.$type === 'testID')?.testID;

        return typeof testID === 'string' ? testID : undefined;
    };
    const MockSegmentedButton = (props: SegmentedButtonProps) => (
        <MockView {...props} testID={getTestID(props.modifiers)} />
    );

    MockSegmentedButton.Label = ({ children }: PropsWithChildren) => children;

    return {
        Host: ({ children }: PropsWithChildren) => children,
        SingleChoiceSegmentedButtonRow: (props: SingleChoiceSegmentedButtonRowProps) => (
            <MockView {...props} testID={getTestID(props.modifiers)} />
        ),
        SegmentedButton: MockSegmentedButton,
        Text: MockText,
    };
});

describe('Android NativeSegmentedControl', () => {
    const options = [
        { label: 'Same label', value: 'standard' },
        { label: 'Same label', value: 'custom' },
    ];

    it('maps selection to the typed value even when labels are identical', async () => {
        const onValueChange = jest.fn();
        const { getByTestId, rerender } = await renderWithBasicProvider(
            <NativeSegmentedControl
                options={options}
                selectedValue="standard"
                onValueChange={onValueChange}
                testID="fees"
            />,
        );

        expect(getByTestId('fees')).toBeOnTheScreen();
        expect(getByTestId('fees/standard').props.selected).toBe(true);
        expect(getByTestId('fees/custom').props.selected).toBe(false);

        await act(() => getByTestId('fees/custom').props.onClick());

        expect(onValueChange).toHaveBeenCalledTimes(1);
        expect(onValueChange).toHaveBeenCalledWith('custom');
        expect(getByTestId('fees/custom').props.selected).toBe(false);

        await rerender(
            <NativeSegmentedControl
                options={options}
                selectedValue="custom"
                onValueChange={onValueChange}
                testID="fees"
            />,
        );

        expect(getByTestId('fees/custom').props.selected).toBe(true);
        expect(getByTestId('fees/standard').props.selected).toBe(false);
    });

    it('ignores late native events after the control becomes disabled', async () => {
        const onValueChange = jest.fn();
        const { getByTestId } = await renderWithBasicProvider(
            <NativeSegmentedControl
                options={options}
                selectedValue="standard"
                onValueChange={onValueChange}
                testID="fees"
                isDisabled
            />,
        );

        expect(getByTestId('fees/custom').props.enabled).toBe(false);

        await act(() => getByTestId('fees/custom').props.onClick());

        expect(onValueChange).not.toHaveBeenCalled();
    });
});
