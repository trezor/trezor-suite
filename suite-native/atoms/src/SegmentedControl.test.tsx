import { View as MockView, Text } from 'react-native';

import { Translation, getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { SegmentedControl, type SegmentedControlProps } from './SegmentedControl';

jest.mock(
    './NativeSegmentedControl',
    () => ({
        supportsNativeSegmentedControl: true,
        NativeSegmentedControl: (props: SegmentedControlProps<string>) => (
            <MockView {...props} testID="native-segmented-control" />
        ),
    }),
    { virtual: true },
);

describe('SegmentedControl', () => {
    it('resolves translated labels while preserving typed option values', async () => {
        const onValueChange = jest.fn();
        const { getByTestId, rerender } = await renderWithBasicProvider(
            <SegmentedControl
                options={[
                    {
                        label: <Translation id="transactionManagement.fees.tabs.standard" />,
                        value: 'standard',
                    },
                    {
                        label: <Translation id="transactionManagement.fees.tabs.custom" />,
                        value: 'custom',
                    },
                ]}
                selectedValue="standard"
                onValueChange={onValueChange}
            />,
        );

        const nativeControl = getByTestId('native-segmented-control');
        expect(nativeControl.props.options).toEqual([
            {
                label: getTranslation('transactionManagement.fees.tabs.standard'),
                value: 'standard',
            },
            {
                label: getTranslation('transactionManagement.fees.tabs.custom'),
                value: 'custom',
            },
        ]);

        await fireEvent(nativeControl, 'valueChange', 'custom');

        expect(onValueChange).toHaveBeenCalledWith('custom');
        expect(nativeControl.props.selectedValue).toBe('standard');

        await rerender(
            <SegmentedControl
                options={[{ label: 'Custom', value: 'custom' }]}
                selectedValue="custom"
                onValueChange={onValueChange}
            />,
        );

        expect(getByTestId('native-segmented-control').props.selectedValue).toBe('custom');
    });

    it('keeps rich labels in the React Native fallback', async () => {
        const onValueChange = jest.fn();
        const { getByRole, queryByTestId } = await renderWithBasicProvider(
            <SegmentedControl
                options={[
                    { label: <Text>Custom label</Text>, value: 'custom' },
                    { label: 'Standard', value: 'standard' },
                ]}
                selectedValue="standard"
                onValueChange={onValueChange}
            />,
        );

        expect(queryByTestId('native-segmented-control')).toBeNull();

        await fireEvent.press(getByRole('tab', { name: 'Custom label' }));

        expect(onValueChange).toHaveBeenCalledWith('custom');
    });

    it('disables the fallback without losing its selected state', async () => {
        const onValueChange = jest.fn();
        const { getByRole } = await renderWithBasicProvider(
            <SegmentedControl
                options={[{ label: <Text>Custom</Text>, value: 'custom' }]}
                selectedValue="custom"
                onValueChange={onValueChange}
                isDisabled
            />,
        );

        const option = getByRole('tab', { name: 'Custom' });

        expect(option).toBeSelected();
        expect(option).toBeDisabled();

        await fireEvent.press(option);

        expect(onValueChange).not.toHaveBeenCalled();
    });

    it('renders nothing for an empty option list', async () => {
        const { queryByTestId } = await renderWithBasicProvider(
            <SegmentedControl options={[]} selectedValue="custom" onValueChange={jest.fn()} />,
        );

        expect(queryByTestId('native-segmented-control')).toBeNull();
    });
});
