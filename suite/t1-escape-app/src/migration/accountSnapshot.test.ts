import type { Address } from '@trezor/blockchain-link-types';

import { DEEP_SCAN_ADDRESS_GAP, HISTORY_PAGE_SIZE, loadAccountSnapshot } from './accountSnapshot';
import { mockAccountInfo } from '../../mocks/mockAccountInfo';
import { mockBackend, mockFundedAccount } from '../../mocks/mockBackend';
import { mockUtxo } from '../../mocks/mockUtxo';
import { mockWallet } from '../../mocks/mockWallet';

const wallet = mockWallet();

const address = (addressIndex: number, balance: string): Address => ({
    address: wallet.getAddress({ accountType: 'p2pkh', addressIndex }),
    path: wallet.getAddressPath({ accountType: 'p2pkh', addressIndex }),
    transfers: 1,
    balance,
    sent: '0',
    received: balance,
});

describe('loadAccountSnapshot', () => {
    it('asks for the transaction history with the deep address gap', async () => {
        const chain = mockBackend();
        const { account, utxos } = mockFundedAccount({
            chain,
            wallet,
            accountType: 'p2pkh',
            amounts: ['100000'],
        });

        const snapshot = await loadAccountSnapshot({ backend: chain.backend, account });

        expect(snapshot.success && snapshot.payload.utxos).toEqual(utxos);
        expect(chain.backend.getAccountInfo).toHaveBeenCalledWith({
            descriptor: account.descriptor,
            details: 'txs',
            tokens: 'derived',
            gap: DEEP_SCAN_ADDRESS_GAP,
            pageSize: HISTORY_PAGE_SIZE,
        });
        expect(chain.backend.getAccountUtxo).toHaveBeenCalledTimes(1);
    });

    it('fetches outputs of funded addresses the account-level listing does not reach', async () => {
        const chain = mockBackend();
        const { account, utxos } = mockFundedAccount({
            chain,
            wallet,
            accountType: 'p2pkh',
            amounts: ['100000'],
        });
        // Address 60 lies beyond the standard gap: the deep scan reports its balance, but the
        // account-level output listing does not include it.
        const deepAddress = address(60, '250000');
        const deepUtxo = mockUtxo({ txid: 'd'.repeat(64), amount: '250000' });
        chain.accountInfos.set(
            account.descriptor,
            mockAccountInfo({
                descriptor: account.descriptor,
                empty: false,
                addresses: {
                    used: [address(0, '100000'), deepAddress, address(61, '0')],
                    unused: [],
                    change: [],
                },
            }),
        );
        chain.utxos.set(deepAddress.address, [
            { ...deepUtxo, address: 'ignored by the loader', path: '' },
        ]);

        const snapshot = await loadAccountSnapshot({ backend: chain.backend, account });

        expect(snapshot.success && snapshot.payload.utxos).toEqual([
            ...utxos,
            { ...deepUtxo, address: deepAddress.address, path: deepAddress.path },
        ]);
        expect(chain.backend.getAccountUtxo.mock.calls).toEqual([
            [account.descriptor],
            [deepAddress.address],
        ]);
    });

    it('does not query addresses that were never used', async () => {
        const chain = mockBackend();
        const { account, utxos } = mockFundedAccount({
            chain,
            wallet,
            accountType: 'p2pkh',
            amounts: ['100000'],
        });
        // Blockbook reports a never used address without any amounts, which is not what the
        // shared type promises. The cast reproduces that shape.
        const neverUsed = [1, 2, 3].map(
            addressIndex =>
                ({
                    address: wallet.getAddress({ accountType: 'p2pkh', addressIndex }),
                    path: wallet.getAddressPath({ accountType: 'p2pkh', addressIndex }),
                    transfers: 0,
                }) as Address,
        );
        chain.accountInfos.set(
            account.descriptor,
            mockAccountInfo({
                descriptor: account.descriptor,
                empty: false,
                addresses: { used: [address(0, '100000')], unused: neverUsed, change: neverUsed },
            }),
        );

        const snapshot = await loadAccountSnapshot({ backend: chain.backend, account });

        expect(snapshot.success && snapshot.payload.utxos).toEqual(utxos);
        expect(chain.backend.getAccountUtxo.mock.calls).toEqual([[account.descriptor]]);
    });

    it.each(['getAccountInfo', 'getAccountUtxo'] as const)(
        'passes a failure of %s through',
        async method => {
            const chain = mockBackend();
            const { account } = mockFundedAccount({
                chain,
                wallet,
                accountType: 'p2pkh',
                amounts: ['100000'],
            });
            chain.backend[method].mockResolvedValue({
                success: false,
                error: { type: 'backend', message: 'offline' },
            });

            expect(await loadAccountSnapshot({ backend: chain.backend, account })).toEqual({
                success: false,
                error: { type: 'backend', message: 'offline' },
            });
        },
    );
});
