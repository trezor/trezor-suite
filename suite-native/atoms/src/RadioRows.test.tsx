import { Text } from 'react-native';

import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { SelectItem } from './Select/SelectItem';
import { SelectableItem } from './SelectableItem';

describe('radio selection rows', () => {
    it('exposes one named selection and invokes the row handler once', async () => {
        const onSelect = jest.fn();
        const { getAllByRole, getByRole } = await renderWithBasicProvider(
            <SelectItem label="Bitcoin" value="btc" isSelected onSelect={onSelect} />,
        );

        expect(getAllByRole('radio')).toHaveLength(1);

        await fireEvent.press(getByRole('radio', { name: 'Bitcoin', checked: true }));

        expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('puts selectable card content and selected state on the same actionable element', async () => {
        const onSelected = jest.fn();
        const { getAllByRole, getByRole, getByTestId } = await renderWithBasicProvider(
            <SelectableItem
                title="Account type"
                content={<Text>Account description</Text>}
                isSelected={false}
                isDefault={false}
                onSelected={onSelected}
                testID="account-type"
            />,
        );

        expect(getAllByRole('radio')).toHaveLength(1);
        const row = getByRole('radio', { name: /Account type/, checked: false });
        expect(row).toBe(getByTestId('account-type'));

        await fireEvent.press(row);

        expect(onSelected).toHaveBeenCalledTimes(1);
    });
});
