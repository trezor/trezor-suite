import { yup } from '@suite-common/validators';
import { type Explorer } from '@suite-common/wallet-config';
import { useForm } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';

import { NetworkExplorerCard } from './NetworkExplorerCard';

const defaultValues: Explorer = {
    base: 'https://explorer.example',
    tx: '/transaction/',
    address: '/address/',
};

const baseLabel = getTranslation('moduleSettings.networkBackends.explorer.labels.base');
const txLabel = getTranslation('moduleSettings.networkBackends.explorer.labels.tx');

const ExplorerForm = ({ onSubmit }: { onSubmit: (value: Explorer) => void }) => {
    const form = useForm<Explorer>({
        defaultValues,
        validation: yup.object({ base: yup.string().url('Enter a valid URL').required() }),
        mode: 'onSubmit',
    });

    return (
        <NetworkExplorerCard
            form={{
                hookForm: form,
                pathInputFields: [
                    { name: 'tx', label: 'moduleSettings.networkBackends.explorer.labels.tx' },
                ],
                isDirty: form.formState.isDirty,
                isDefault: false,
                submit: form.handleSubmit(onSubmit),
                setToDefault: () => form.reset(defaultValues),
            }}
        />
    );
};

describe('NetworkExplorerCard native fields', () => {
    it('keeps URL keyboard settings, validates input, and submits the entered URL and path', async () => {
        const onSubmit = jest.fn();
        const { getByLabelText, getByRole, getByText, queryByText } = await renderWithStoreProvider(
            <ExplorerForm onSubmit={onSubmit} />,
        );
        const input = getByLabelText(baseLabel);

        expect(input.props.keyboardType).toBe('url');
        expect(input.props.autoCapitalize).toBe('none');
        expect(input.props.autoCorrect).toBe(false);

        await fireEvent.changeText(input, 'invalid');
        await fireEvent.press(
            getByRole('button', { name: getTranslation('generic.buttons.confirm') }),
        );
        expect(getByText('Enter a valid URL')).toBeOnTheScreen();
        expect(onSubmit).not.toHaveBeenCalled();

        await fireEvent.changeText(input, 'https://custom.example');
        await fireEvent.changeText(getByLabelText(txLabel), '/tx/');
        await fireEvent.press(
            getByRole('button', { name: getTranslation('generic.buttons.confirm') }),
        );
        expect(queryByText('Enter a valid URL')).toBeNull();
        expect(onSubmit).toHaveBeenCalledWith(
            { ...defaultValues, base: 'https://custom.example', tx: '/tx/' },
            undefined,
        );
    });

    it('restores edited fields and dirty state when the explorer is reset to default', async () => {
        const { getByLabelText, getByRole, queryByRole } = await renderWithStoreProvider(
            <ExplorerForm onSubmit={jest.fn()} />,
        );

        await fireEvent.changeText(getByLabelText(baseLabel), 'https://custom.example');
        await fireEvent.changeText(getByLabelText(txLabel), '/tx/');
        expect(
            getByRole('button', { name: getTranslation('generic.buttons.confirm') }),
        ).toBeOnTheScreen();
        await fireEvent.press(
            getByRole('button', {
                name: getTranslation('moduleSettings.networkBackends.explorer.setToDefaultButton'),
            }),
        );

        expect(getByLabelText(baseLabel)).toHaveDisplayValue(defaultValues.base);
        expect(getByLabelText(txLabel)).toHaveDisplayValue(defaultValues.tx);
        expect(
            queryByRole('button', { name: getTranslation('generic.buttons.confirm') }),
        ).toBeNull();
    });
});
