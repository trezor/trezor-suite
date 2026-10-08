import type { Address } from '@trezor/blockchain-link-types';

import fixtures from './__fixtures__/state';
import { WorkerState } from './state';

const state = new WorkerState();

describe('Add and remove address in sequence', () => {
    fixtures.addAddresses.forEach(f => {
        it('add address', () => {
            if (!f.error) {
                // @ts-expect-error invalid param
                const unique = state.addAddresses(f.input);
                expect(unique).toEqual(f.unique);
                expect(state.getAddresses()).toEqual(f.subscribed);
            } else {
                // @ts-expect-error invalid param
                expect(() => state.addAddresses(f.input)).toThrow(f.error);
            }
        });
    });

    fixtures.removeAddresses.forEach(f => {
        it('remove address', () => {
            if (!f.error) {
                // @ts-expect-error invalid param
                const unique = state.removeAddresses(f.input);
                expect(unique).toEqual(f.subscribed);
                expect(state.getAddresses()).toEqual(f.subscribed);
            } else {
                // @ts-expect-error invalid param
                expect(() => state.removeAddresses(f.input)).toThrow(f.error);
            }
        });
    });
});

describe('Add and remove account in sequence', () => {
    fixtures.addAccounts.forEach(f => {
        it('add account', () => {
            // @ts-expect-error invalid param
            state.addAccounts(f.input);
            expect(state.getAccounts()).toEqual(f.subscribedAccounts);
            expect(state.getAddresses()).toEqual(f.subscribedAddresses);
        });
    });

    fixtures.removeAccounts.forEach(f => {
        it('remove account', () => {
            state.removeAccounts(f.input);
            expect(state.getAccounts()).toEqual(f.subscribedAccounts);
            expect(state.getAddresses()).toEqual(f.subscribedAddresses);
        });
    });
});

describe('Address bookkeeping', () => {
    const mockAddress = (address: string): Address => ({
        address,
        path: '',
        transfers: 0,
        balance: '0',
        sent: '0',
        received: '0',
    });

    it('reports a removed address as new again and appends it at the end', () => {
        const freshState = new WorkerState();
        freshState.addAddresses(['A', 'B']);
        freshState.removeAddresses(['A']);

        expect(freshState.addAddresses(['A', 'C'])).toEqual(['A', 'C']);
        expect(freshState.getAddresses()).toEqual(['B', 'A', 'C']);
    });

    it('leaves a previously returned address list untouched when adding more', () => {
        const freshState = new WorkerState();
        freshState.addAddresses(['A']);
        const previousAddresses = freshState.getAddresses();

        freshState.addAddresses(['B']);

        expect(previousAddresses).toEqual(['A']);
        expect(freshState.getAddresses()).toEqual(['A', 'B']);
    });

    it('re-adds addresses of a subscribed account that were removed individually', () => {
        const freshState = new WorkerState();
        freshState.addAccounts([
            {
                descriptor: 'xpub',
                addresses: { change: [], used: [mockAddress('A')], unused: [mockAddress('B')] },
            },
        ]);
        freshState.removeAddresses(['B']);

        freshState.addAccounts([{ descriptor: 'xpub2' }]);

        expect(freshState.getAddresses()).toEqual(['A', 'B', 'xpub2']);
    });
});
