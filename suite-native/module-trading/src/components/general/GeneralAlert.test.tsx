import { renderWithBasicProvider } from '@suite-native/test-utils';

import { GeneralAlert, type GeneralAlertProps } from './GeneralAlert';

describe('GeneralAlert', () => {
    const renderGeneralAlert = async (props: GeneralAlertProps) =>
        await renderWithBasicProvider(<GeneralAlert {...props} />);

    it('should render nothing when no text is provided', async () => {
        const { toJSON } = await renderGeneralAlert({});

        expect(toJSON()).toBeNull();
    });

    it('should render nothing for empty text', async () => {
        const { toJSON } = await renderGeneralAlert({ text: '' });

        expect(toJSON()).toBeNull();
    });

    it('should render alert with provided text', async () => {
        const { getByText } = await renderGeneralAlert({ text: 'Test Alert' });

        expect(getByText('Test Alert')).toBeTruthy();
    });
});
