import { act, renderHook } from '@testing-library/react';

import { type AssetId, toTokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { activateNetworkWithDiscoveryThunk } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { createDeferred } from '@trezor/utils';

import { useGlobalReceiveNetworkSetup } from './useGlobalReceiveNetworkSetup';

type SetupProps = Parameters<typeof useGlobalReceiveNetworkSetup>[0];
const mockDispatch = jest.fn();

jest.mock('@suite/device', () => ({
    useDevice: () => ({
        device: { path: 'device-path', state: { staticSessionId: 'device-state' } },
    }),
}));
jest.mock('@suite/intl', () => ({
    useTranslation: () => ({ translationString: () => 'No account found' }),
}));
jest.mock('@trezor/dependency-injection', () => ({
    ...jest.requireActual('@trezor/dependency-injection'),
    useServices: () => ({ dispatch: mockDispatch }),
}));
jest.mock('#src/hooks/suite', () => ({
    useDiscovery: () => ({ isDiscoveryRunning: false }),
}));

const eth = asNetworkSymbol('eth');
const token: AssetId = {
    networkSymbol: eth,
    contractAddress: toTokenAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
};
const equivalentToken: AssetId = {
    networkSymbol: eth,
    contractAddress: toTokenAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'),
};

const renderSetup = () => {
    const accounts: Account[] = [];
    const props: SetupProps = {
        selectedAssetId: token,
        selectedAssetAccounts: accounts,
        wasSelectedAssetNetworkInactive: false,
        onAccountSelectionRequired: jest.fn(),
        onSetupFailure: jest.fn(),
        submitSelection: jest.fn(),
    };
    const setup = renderHook(useGlobalReceiveNetworkSetup, { initialProps: props });

    return { ...setup, props };
};

describe('receive network setup identity', () => {
    beforeEach(() => mockDispatch.mockReset());

    it('keeps discovery running when the same asset gets a new object or address casing', () => {
        const deferred = createDeferred();
        const abort = jest.fn();
        mockDispatch.mockReturnValue(
            Object.assign(deferred.promise, { abort, requestId: 'setup' }),
        );
        const { rerender, props, unmount } = renderSetup();

        rerender({ ...props, selectedAssetId: equivalentToken });

        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(abort).not.toHaveBeenCalled();
        unmount();
        expect(abort).toHaveBeenCalledTimes(1);
    });

    it('aborts the previous request when the selected asset changes', () => {
        const deferred = createDeferred();
        const abort = jest.fn();
        mockDispatch.mockReturnValue(
            Object.assign(deferred.promise, { abort, requestId: 'setup' }),
        );
        const { rerender, props } = renderSetup();

        rerender({ ...props, selectedAssetId: { networkSymbol: eth } });

        expect(abort).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledTimes(2);
    });

    it('uses completed discovery after an equivalent identity arrives with the accounts', async () => {
        const deferred = createDeferred<{
            type: string;
            payload: { success: boolean; payload: { discoveredAccountCount: number } };
        }>();
        mockDispatch
            .mockReturnValueOnce(
                Object.assign(deferred.promise, { abort: jest.fn(), requestId: 'setup' }),
            )
            .mockReturnValue(
                Object.assign(createDeferred().promise, { abort: jest.fn(), requestId: 'next' }),
            );
        const { rerender, props } = renderSetup();
        const account = mockWalletAccount({ symbol: eth });
        await act(async () => {
            rerender({
                ...props,
                selectedAssetId: equivalentToken,
                selectedAssetAccounts: [account],
            });
            deferred.resolve({
                type: activateNetworkWithDiscoveryThunk.fulfilled.type,
                payload: { success: true, payload: { discoveredAccountCount: 1 } },
            });
            await deferred.promise;
        });

        expect(props.submitSelection).toHaveBeenCalledWith(account);
        expect(props.onSetupFailure).not.toHaveBeenCalled();
    });
});
