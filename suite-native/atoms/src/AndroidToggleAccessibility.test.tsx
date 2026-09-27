import { Pressable, Text } from 'react-native';

import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { AndroidToggleAccessibility } from './AndroidToggleAccessibility';

describe('AndroidToggleAccessibility', () => {
    it('exposes one named toggle and changes its value on an accessibility activation', async () => {
        const onChange = jest.fn();
        const { getAllByRole, getByRole, getByTestId } = await renderWithBasicProvider(
            <AndroidToggleAccessibility
                accessibilityLabel="Share system information"
                testID="share-info"
                role="checkbox"
                isChecked={false}
                isDisabled={false}
                onChange={onChange}
            >
                <Pressable accessibilityRole="checkbox" accessibilityLabel="Native checkbox">
                    <Text>Native checkbox</Text>
                </Pressable>
            </AndroidToggleAccessibility>,
        );

        expect(getAllByRole('checkbox')).toHaveLength(1);
        expect(getByTestId('share-info')).toBe(
            getByRole('checkbox', { name: 'Share system information' }),
        );

        await fireEvent(
            getByRole('checkbox', { name: 'Share system information' }),
            'accessibilityAction',
            {
                nativeEvent: { actionName: 'activate' },
            },
        );

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(true);
    });

    it('does not activate a disabled toggle', async () => {
        const onChange = jest.fn();
        const { getByRole } = await renderWithBasicProvider(
            <AndroidToggleAccessibility
                accessibilityLabel="Discreet mode"
                role="switch"
                isChecked
                isDisabled
                onChange={onChange}
            >
                <Text>Native switch</Text>
            </AndroidToggleAccessibility>,
        );

        const control = getByRole('switch', { name: 'Discreet mode' });
        expect(control).toBeDisabled();

        await fireEvent(control, 'accessibilityAction', {
            nativeEvent: { actionName: 'activate' },
        });

        expect(onChange).not.toHaveBeenCalled();
    });
});
