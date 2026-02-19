import { renderWithBasicProvider } from '@suite-native/test-utils';

import { GeneralAlert, GeneralAlertProps } from '../GeneralAlert';

describe('GeneralAlert', () => {
    const renderGeneralAlert = (props: GeneralAlertProps) =>
        renderWithBasicProvider(<GeneralAlert {...props} />);

    it('should render nothing when no text is provided', () => {
        const { toJSON } = renderGeneralAlert({});

        expect(toJSON()).toBeNull();
    });

    it('should render nothing for empty text', () => {
        const { toJSON } = renderGeneralAlert({ text: '' });

        expect(toJSON()).toBeNull();
    });

    it('should render alert with provided text', () => {
        const { getByText } = renderGeneralAlert({ text: 'Test Alert' });

        expect(getByText('Test Alert')).toBeTruthy();
    });
});
