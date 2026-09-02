import { Text } from 'react-native';

import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { AsyncButton, type AsyncButtonProps } from './AsyncButton';

describe('AsyncButton', () => {
    const renderAsyncButton = async (props: Partial<AsyncButtonProps>) =>
        await renderWithBasicProvider(
            <AsyncButton
                onPress={() => new Promise(resolve => setTimeout(resolve, 1000))}
                testID="async-button"
                {...props}
            >
                <Text>Press me</Text>
            </AsyncButton>,
        );

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should display loading indicator after press', async () => {
        const { getByTestId, getByText } = await renderAsyncButton({});

        const pressPromise = fireEvent.press(getByText('Press me'));
        await jest.advanceTimersByTimeAsync(0);

        expect(getByTestId('async-button/loading')).toBeOnTheScreen();

        await jest.runAllTimersAsync();
        await pressPromise;
    });

    it('should hide loading indicator after async operation is complete', async () => {
        const { getByText, queryByTestId } = await renderAsyncButton({});

        const pressPromise = fireEvent.press(getByText('Press me'));
        await jest.runAllTimersAsync();
        await pressPromise;

        expect(queryByTestId('async-button/loading')).toBeNull();
    });

    it('should handle onPress rejection gracefully', async () => {
        const { getByText, queryByTestId } = await renderAsyncButton({
            onPress: () =>
                new Promise((_, reject) => setTimeout(() => reject(new Error('Failed')), 1000)),
        });

        const pressPromise = fireEvent.press(getByText('Press me'));
        await jest.runAllTimersAsync();
        await pressPromise;

        expect(queryByTestId('async-button/loading')).toBeNull();
    });

    it('should call onReject on rejection', async () => {
        const mockOnReject = jest.fn();
        const { getByText } = await renderAsyncButton({
            onPress: () =>
                new Promise((_, reject) => setTimeout(() => reject(new Error('Failed')), 1000)),
            onReject: mockOnReject,
        });

        const pressPromise = fireEvent.press(getByText('Press me'));

        await jest.runAllTimersAsync();
        await pressPromise;

        expect(mockOnReject).toHaveBeenCalledWith(new Error('Failed'));
    });
});
