import { getTranslation } from '@suite-native/intl';
import { act, fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { ServerOffline, type ServerOfflineProps } from '../ServerOffline';

describe('ServerOffline', () => {
    const renderServerOffline = (props: Partial<ServerOfflineProps>) =>
        renderWithBasicProvider(<ServerOffline onRetryPress={jest.fn()} {...props} />);

    it('should call onRetryPress when "Try again" button is pressed', () => {
        const retryPressMock = jest.fn();
        const { getByText } = renderServerOffline({ onRetryPress: retryPressMock });

        const retryButton = getByText(getTranslation('tradingAtoms.error.serverOfflineRetry'));

        act(() => {
            fireEvent.press(retryButton);
        });

        expect(retryPressMock).toHaveBeenCalledTimes(1);
    });
});
