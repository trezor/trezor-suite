import { Text } from 'react-native';

import { act, fireEvent, renderWithProviders } from '@suite-native/test-utils';

import { AsyncButton, type AsyncButtonProps } from '../AsyncButton';

describe('AsyncButton', () => {
    const renderAsyncButton = (props: Partial<AsyncButtonProps>) =>
        renderWithProviders(
            <AsyncButton
                onPress={() => new Promise(resolve => setTimeout(resolve, 1000))}
                testID="async-button"
                {...props}
            >
                <Text>Press me</Text>
            </AsyncButton>,
            { providers: ['intl'] },
        );

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should display loading indicator after press', async () => {
        const { getByTestId, getByText } = renderAsyncButton({});

        fireEvent.press(getByText('Press me'));

        expect(getByTestId('async-button/loading')).toBeOnTheScreen();

        await act(async () => {
            jest.runAllTimers();
            await Promise.resolve();
        });
    });

    it('should hide loading indicator after async operation is complete', async () => {
        const { getByText, queryByTestId } = renderAsyncButton({});

        fireEvent.press(getByText('Press me'));
        await act(async () => {
            jest.runAllTimers();
            await Promise.resolve();
        });

        expect(queryByTestId('async-button/loading')).toBeNull();
    });

    it('should handle onPress rejection gracefully', async () => {
        const { getByText, queryByTestId } = renderAsyncButton({
            onPress: () =>
                new Promise((_, reject) => setTimeout(() => reject(new Error('Failed')), 1000)),
        });

        fireEvent.press(getByText('Press me'));
        await act(async () => {
            jest.runAllTimers();
            await Promise.resolve();
        });

        expect(queryByTestId('async-button/loading')).toBeNull();
    });

    it('should call onReject on rejection', async () => {
        const mockOnReject = jest.fn();
        const { getByText } = renderAsyncButton({
            onPress: () =>
                new Promise((_, reject) => setTimeout(() => reject(new Error('Failed')), 1000)),
            onReject: mockOnReject,
        });

        fireEvent.press(getByText('Press me'));

        await act(async () => {
            jest.runAllTimers();
            await Promise.resolve();
        });

        expect(mockOnReject).toHaveBeenCalledWith(new Error('Failed'));
    });
});
