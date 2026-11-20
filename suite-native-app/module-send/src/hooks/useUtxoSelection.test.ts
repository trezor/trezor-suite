import { useAtom } from 'jotai';

import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { renderHook } from '@suite-native/test-utils';

import { type SelectedUtxos } from '../types';
import { useUtxoSelection } from './useUtxoSelection';

const accountKey = mockAccountKey({ descriptor: 'testAccKey' });

jest.mock('jotai', () => ({
    useAtom: jest.fn(() => [[], jest.fn()]),
    atom: jest.fn(),
}));

jest.mock('jotai/utils', () => ({
    atomWithStorage: jest.fn(() => ({
        onMount: jest.fn(),
    })),
    createJSONStorage: jest.fn(),
    useAtomValue: jest.fn(),
}));

describe('useUtxoSelection', () => {
    const mockSetSelectedUtxos = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an empty array when no UTXOs are selected', async () => {
        (useAtom as jest.Mock).mockReturnValue([[], mockSetSelectedUtxos]);

        const { result } = await renderHook(() => useUtxoSelection(accountKey));

        expect(result.current.selectedUtxos).toEqual([]);
        expect(result.current.totalSelectedAmount.toString()).toEqual('0');
        expect(result.current.isCoinControlEnabled).toBe(false);
    });

    it('should calculate total selected amount correctly', async () => {
        const mockUtxos: SelectedUtxos = {
            [accountKey]: [
                {
                    txid: 'txid1',
                    vout: 0,
                    amount: '1000',
                    blockHeight: 123456,
                    address: 'address1',
                    path: 'm/44/0/0/0',
                    confirmations: 10,
                },
                {
                    txid: 'txid2',
                    vout: 1,
                    amount: '2000',
                    blockHeight: 123457,
                    address: 'address2',
                    path: 'm/44/0/0/1',
                    confirmations: 20,
                },
            ],
        };
        (useAtom as jest.Mock).mockReturnValue([mockUtxos, mockSetSelectedUtxos]);

        const { result } = await renderHook(() => useUtxoSelection(accountKey));

        expect(result.current.totalSelectedAmount.toString()).toEqual('3000');
    });

    it('should handle correct account key UTXO selection', async () => {
        (useAtom as jest.Mock).mockReturnValue([
            {
                ['testAccKey2']: [
                    {
                        txid: 'txid1',
                        vout: 0,
                        amount: '1000',
                        blockHeight: 123456,
                        address: 'address1',
                        path: 'm/44/0/0/0',
                        confirmations: 10,
                    },
                ],
            },
            mockSetSelectedUtxos,
        ]);

        const { result } = await renderHook(() => useUtxoSelection(accountKey));

        expect(result.current.selectedUtxos).toEqual([]);
        expect(result.current.totalSelectedAmount.toString()).toEqual('0');
    });
});
