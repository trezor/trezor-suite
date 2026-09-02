import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useWaitForButtonRequest } from './useWaitForButtonRequest';

const mockSelectDeviceButtonRequestsCodes = jest.fn().mockReturnValue([]);

jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectDeviceButtonRequestsCodes: () => mockSelectDeviceButtonRequestsCodes(),
}));

describe('useWaitForButtonRequest.ts', () => {
    const renderUseWaitForButtonRequest = async (initialCallback: jest.Mock) =>
        await renderHookWithStoreProvider(
            ({ onButtonRequest }) => useWaitForButtonRequest(onButtonRequest),
            {
                initialProps: {
                    onButtonRequest: initialCallback,
                },
            },
        );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call callback once there are any button requests', async () => {
        const callback = jest.fn();
        const { result, rerender } = await renderUseWaitForButtonRequest(callback);

        await act(() => {
            result.current();
        });

        expect(callback).not.toHaveBeenCalled();

        // we are use mock, we need to rerender manually
        mockSelectDeviceButtonRequestsCodes.mockReturnValue(['buttonRequestMock1']);
        await rerender({ onButtonRequest: callback });

        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not call callback multiple times', async () => {
        const callback = jest.fn();
        const { result, rerender } = await renderUseWaitForButtonRequest(callback);

        await act(() => {
            result.current();
        });

        // we are use mock, we need to rerender manually
        mockSelectDeviceButtonRequestsCodes.mockReturnValue(['buttonRequestMock1']);
        await rerender({ onButtonRequest: callback });
        mockSelectDeviceButtonRequestsCodes.mockReturnValue([
            'buttonRequestMock1',
            'buttonRequestMock2',
        ]);
        await rerender({ onButtonRequest: callback });

        expect(callback).toHaveBeenCalledTimes(1);
    });
});
