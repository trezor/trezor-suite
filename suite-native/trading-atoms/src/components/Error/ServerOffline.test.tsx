import { getTranslation } from '@suite-native/intl';
import { act, fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { ServerOffline, type ServerOfflineProps } from './ServerOffline';

describe('ServerOffline', () => {
    const renderServerOffline = async (props: Partial<ServerOfflineProps>) =>
        await renderWithBasicProvider(<ServerOffline onRetryPress={jest.fn()} {...props} />);

    it('should call onRetryPress when "Try again" button is pressed', async () => {
        const retryPressMock = jest.fn();
        const { getByText } = await renderServerOffline({ onRetryPress: retryPressMock });

        const retryButton = getByText(getTranslation('tradingAtoms.error.serverOfflineRetry'));

        await act(async () => {
            await fireEvent.press(retryButton);
        });

        expect(retryPressMock).toHaveBeenCalledTimes(1);
    });
});
