import { Text } from 'react-native';

import { act, renderWithBasicProvider, userEvent } from '@suite-native/test-utils';
import { createDeferred } from '@trezor/utils';

import { AsyncButton, type AsyncButtonProps } from './AsyncButton';

describe('AsyncButton', () => {
    const renderAsyncButton = (props: AsyncButtonProps) =>
        renderWithBasicProvider(<AsyncButton testID="async-button" {...props} />);

    it('disables repeated activation and shows a loader until the action finishes', async () => {
        const action = createDeferred<void>();
        const onPress = jest.fn(() => action.promise);
        const { getByRole, getByTestId, queryByTestId } = await renderAsyncButton({
            onPress,
            children: <Text>Press me</Text>,
        });

        await userEvent.press(getByRole('button', { name: 'Press me' }));

        expect(getByTestId('async-button/loading')).toBeOnTheScreen();
        expect(getByRole('button', { busy: true })).toBeDisabled();

        await userEvent.press(getByRole('button'));
        expect(onPress).toHaveBeenCalledTimes(1);

        await act(async () => {
            action.resolve();
            await action.promise;
        });

        expect(queryByTestId('async-button/loading')).toBeNull();
        expect(getByRole('button')).toBeEnabled();
    });

    it('restores the button after a rejected action', async () => {
        const action = createDeferred<void>();
        const { getByRole, queryByTestId } = await renderAsyncButton({
            onPress: () => action.promise,
            children: 'Press me',
        });

        await userEvent.press(getByRole('button'));
        await act(async () => {
            action.reject(new Error('Failed'));
            await action.promise.catch(() => undefined);
        });

        expect(queryByTestId('async-button/loading')).toBeNull();
        expect(getByRole('button')).toBeEnabled();
    });

    it('calls onReject once with the original rejection', async () => {
        const error = new Error('Failed');
        const onReject = jest.fn();
        const { getByRole } = await renderAsyncButton({
            onPress: () => Promise.reject(error),
            onReject,
            children: 'Press me',
        });

        await userEvent.press(getByRole('button'));

        expect(onReject).toHaveBeenCalledTimes(1);
        expect(onReject).toHaveBeenCalledWith(error);
        expect(getByRole('button')).toBeEnabled();
    });
});
