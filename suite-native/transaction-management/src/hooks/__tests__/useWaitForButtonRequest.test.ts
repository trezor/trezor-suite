import { act, renderHookWithStoreProviderAsync } from '@suite-native/test-utils';

import { useWaitForButtonRequest } from '../useWaitForButtonRequest';

const mockSelectDeviceButtonRequestsCodes = jest.fn().mockReturnValue([]);

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectDeviceButtonRequestsCodes: () => mockSelectDeviceButtonRequestsCodes(),
}));

describe('useWaitForButtonRequest.ts', () => {
    const renderUseWaitForButtonRequest = (initialCallback: jest.Mock) =>
        renderHookWithStoreProviderAsync(
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

        act(() => {
            result.current();
        });

        expect(callback).not.toHaveBeenCalled();

        // we are use mock, we need to rerender manually
        mockSelectDeviceButtonRequestsCodes.mockReturnValue(['buttonRequestMock1']);
        rerender({ onButtonRequest: callback });

        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not call callback multiple times', async () => {
        const callback = jest.fn();
        const { result, rerender } = await renderUseWaitForButtonRequest(callback);

        act(() => {
            result.current();
        });

        // we are use mock, we need to rerender manually
        mockSelectDeviceButtonRequestsCodes.mockReturnValue(['buttonRequestMock1']);
        rerender({ onButtonRequest: callback });
        mockSelectDeviceButtonRequestsCodes.mockReturnValue([
            'buttonRequestMock1',
            'buttonRequestMock2',
        ]);
        rerender({ onButtonRequest: callback });

        expect(callback).toHaveBeenCalledTimes(1);
    });
});
