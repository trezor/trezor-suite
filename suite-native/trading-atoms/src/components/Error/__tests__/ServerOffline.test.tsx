import { act, fireEvent, renderWithProviders } from '@suite-native/test-utils';

import { ServerOffline, type ServerOfflineProps } from '../ServerOffline';

describe('ServerOffline', () => {
    const renderServerOffline = (props: Partial<ServerOfflineProps>) =>
        renderWithProviders(<ServerOffline onRetryPress={jest.fn()} {...props} />, {
            providers: ['intl'],
        });

    it('should call onRetryPress when "Try again" button is pressed', () => {
        const retryPressMock = jest.fn();
        const { getByText } = renderServerOffline({ onRetryPress: retryPressMock });

        const retryButton = getByText('Try again');

        act(() => {
            fireEvent.press(retryButton);
        });

        expect(retryPressMock).toHaveBeenCalledTimes(1);
    });
});
