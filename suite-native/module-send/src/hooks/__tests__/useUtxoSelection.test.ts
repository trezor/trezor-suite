import { useAtom } from 'jotai';

import { type AccountKey } from '@suite-common/wallet-types';
import { renderHook } from '@suite-native/test-utils';

import { type SelectedUtxos } from '../../types';
import { useUtxoSelection } from '../useUtxoSelection';

const accountKey = 'testAccKey' as AccountKey; // Todo: create properly via `createAccountKey()`

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

    it('should return an empty array when no UTXOs are selected', () => {
        (useAtom as jest.Mock).mockReturnValue([[], mockSetSelectedUtxos]);

        const { result } = renderHook(() => useUtxoSelection(accountKey));

        expect(result.current.selectedUtxos).toEqual([]);
        expect(result.current.totalSelectedAmount.toString()).toEqual('0');
        expect(result.current.isCoinControlEnabled).toBe(false);
    });

    it('should calculate total selected amount correctly', () => {
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

        const { result } = renderHook(() => useUtxoSelection(accountKey));

        expect(result.current.totalSelectedAmount.toString()).toEqual('3000');
    });

    it('should handle correct account key UTXO selection', () => {
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

        const { result } = renderHook(() => useUtxoSelection(accountKey));

        expect(result.current.selectedUtxos).toEqual([]);
        expect(result.current.totalSelectedAmount.toString()).toEqual('0');
    });
});
