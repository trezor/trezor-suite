import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { TouchableSwitchRow } from './TouchableSwitchRow';

describe('TouchableSwitchRow', () => {
    it('exposes one named switch and toggles the row once', async () => {
        const onChange = jest.fn();
        const { getAllByRole, getByRole, getByTestId } = await renderWithBasicProvider(
            <TouchableSwitchRow
                icon="eye"
                text="Discreet mode"
                accessibilityLabel="Hide balances"
                isChecked={false}
                onChange={onChange}
                testID="discreet-mode"
            />,
        );

        expect(getAllByRole('switch')).toHaveLength(1);
        expect(getByRole('switch', { name: 'Hide balances' })).toBe(getByTestId('discreet-mode'));

        await fireEvent.press(getByTestId('discreet-mode'));

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(true);
    });

    it('keeps Learn more accessible without toggling the switch', async () => {
        const onChange = jest.fn();
        const onLearnMorePress = jest.fn();
        const { getByRole } = await renderWithBasicProvider(
            <TouchableSwitchRow
                icon="eye"
                text="Discreet mode"
                isChecked
                onChange={onChange}
                onLearnMorePress={onLearnMorePress}
            />,
        );

        await fireEvent.press(
            getByRole('button', { name: getTranslation('generic.buttons.learnMore') }),
        );

        expect(onLearnMorePress).toHaveBeenCalledTimes(1);
        expect(onChange).not.toHaveBeenCalled();
    });
});
