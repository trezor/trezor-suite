import { asNetworkSymbol } from '@suite-common/wallet-config';
import { useFetchFeesOnce, useYieldGasReserve } from '@suite-common/wallet-core';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useYieldDepositGasReserve } from './useYieldDepositGasReserve';

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    useFetchFeesOnce: jest.fn(),
    useYieldGasReserve: jest.fn(),
}));

const useFetchFeesOnceMock = jest.mocked(useFetchFeesOnce);
const useYieldGasReserveMock = jest.mocked(useYieldGasReserve);

const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const gasReserve = { minimum: '0.002', recommended: '0.005' };

describe('useYieldDepositGasReserve', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useYieldGasReserveMock.mockReturnValue(gasReserve);
    });

    it('fetches the fee estimate and freezes the reserve into the deposit session', async () => {
        const { result } = await renderHookWithBasicProvider(() =>
            useYieldDepositGasReserve({
                account,
                isWrappedNativeVault: true,
                tokenContractAddress: '0xweth',
                flowKey: 'flow-key',
            }),
        );

        expect(useFetchFeesOnceMock).toHaveBeenCalledWith({
            networkSymbol: account.symbol,
            isDisabled: false,
        });
        expect(useYieldGasReserveMock).toHaveBeenCalledWith({
            networkSymbol: account.symbol,
            isWrappedNativeVault: true,
            tokenContractAddress: '0xweth',
            flowType: 'deposit',
            flowKey: 'flow-key',
        });
        expect(result.current).toBe(gasReserve);
    });

    it('does not address a session for the standalone wrap', async () => {
        await renderHookWithBasicProvider(() =>
            useYieldDepositGasReserve({
                account,
                isWrappedNativeVault: true,
                tokenContractAddress: '0xweth',
            }),
        );

        expect(useYieldGasReserveMock).toHaveBeenCalledWith(
            expect.objectContaining({ flowType: undefined, flowKey: undefined }),
        );
    });

    it('skips the fee fetch while disabled', async () => {
        await renderHookWithBasicProvider(() =>
            useYieldDepositGasReserve({
                account,
                isWrappedNativeVault: true,
                tokenContractAddress: '0xweth',
                isDisabled: true,
            }),
        );

        expect(useFetchFeesOnceMock).toHaveBeenCalledWith({
            networkSymbol: account.symbol,
            isDisabled: true,
        });
    });

    it('passes no network while the account is unresolved', async () => {
        await renderHookWithBasicProvider(() =>
            useYieldDepositGasReserve({ account: null, isWrappedNativeVault: false }),
        );

        expect(useFetchFeesOnceMock).toHaveBeenCalledWith({
            networkSymbol: undefined,
            isDisabled: false,
        });
        expect(useYieldGasReserveMock).toHaveBeenCalledWith(
            expect.objectContaining({ networkSymbol: undefined }),
        );
    });
});
