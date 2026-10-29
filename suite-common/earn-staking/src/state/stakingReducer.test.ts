import {
    mockStakingPosition,
    mockStakingProductDescriptor,
    mockStakingProductInfo,
} from '@suite-common/earn-staking-common/mocks';
import { accountsActions } from '@suite-common/wallet-core';
import { mockAccountKey, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { stakingActions, stakingInitialState, stakingReducer } from './stakingReducer';

const eth = mockStakingProductDescriptor();
const sol = mockStakingProductDescriptor({ symbol: asNetworkSymbol('sol'), type: 'native' });
const accountKey = mockAccountKey({ symbol: asNetworkSymbol('eth') });
const otherAccountKey = mockAccountKey({ descriptor: 'other', symbol: asNetworkSymbol('eth') });

const registered = stakingReducer(
    stakingInitialState,
    stakingActions.productsRegistered({ platform: 'desktop', descriptors: [eth, sol] }),
);

const withInfo = stakingReducer(
    registered,
    stakingActions.productInfoFetched({
        productId: eth.id,
        info: mockStakingProductInfo(),
        fetchedAt: 1_777_000_000_000,
    }),
);

describe('stakingReducer', () => {
    it('starts without a platform, products or positions', () => {
        expect(stakingReducer(undefined, { type: 'init' })).toEqual(stakingInitialState);
    });

    describe('productsRegistered', () => {
        it('stores the platform and an idle entry per descriptor', () => {
            expect(registered.platform).toBe('desktop');
            expect(Object.keys(registered.products)).toEqual([eth.id, sol.id]);
            expect(registered.products[eth.id]).toEqual({
                descriptor: eth,
                info: null,
                infoStatus: 'idle',
                infoFetchedAt: null,
                infoError: null,
            });
        });

        it('keeps the info of a product registered again and drops the others', () => {
            const updatedEth = mockStakingProductDescriptor({ rateKind: 'apr' });
            const state = stakingReducer(
                withInfo,
                stakingActions.productsRegistered({
                    platform: 'mobile',
                    descriptors: [updatedEth],
                }),
            );

            expect(state.platform).toBe('mobile');
            expect(Object.keys(state.products)).toEqual([eth.id]);
            expect(state.products[eth.id]?.descriptor).toEqual(updatedEth);
            expect(state.products[eth.id]?.info).toEqual(mockStakingProductInfo());
            expect(state.products[eth.id]?.infoStatus).toBe('ready');
        });

        it('keeps positions', () => {
            const synced = stakingReducer(
                registered,
                stakingActions.positionsSynced({ accountKey, positions: [mockStakingPosition()] }),
            );
            const state = stakingReducer(
                synced,
                stakingActions.productsRegistered({ platform: 'desktop', descriptors: [eth] }),
            );

            expect(state.positions).toBe(synced.positions);
        });
    });

    describe('product info', () => {
        it('marks a product loading and keeps its last info', () => {
            const state = stakingReducer(
                withInfo,
                stakingActions.productInfoRequested({ productId: eth.id }),
            );

            expect(state.products[eth.id]?.infoStatus).toBe('loading');
            expect(state.products[eth.id]?.info).toEqual(mockStakingProductInfo());
            expect(state.products[eth.id]?.infoFetchedAt).toBe(1_777_000_000_000);
        });

        it('stores fetched info with its time and clears a previous error', () => {
            const failed = stakingReducer(
                registered,
                stakingActions.productInfoFailed({ productId: eth.id, error: 'offline' }),
            );
            const state = stakingReducer(
                failed,
                stakingActions.productInfoFetched({
                    productId: eth.id,
                    info: mockStakingProductInfo(),
                    fetchedAt: 1_777_000_000_000,
                }),
            );

            expect(state.products[eth.id]).toEqual({
                descriptor: eth,
                info: mockStakingProductInfo(),
                infoStatus: 'ready',
                infoFetchedAt: 1_777_000_000_000,
                infoError: null,
            });
        });

        it('records a failure and keeps the last info and its time', () => {
            const state = stakingReducer(
                withInfo,
                stakingActions.productInfoFailed({ productId: eth.id, error: 'offline' }),
            );

            expect(state.products[eth.id]?.infoStatus).toBe('error');
            expect(state.products[eth.id]?.infoError).toBe('offline');
            expect(state.products[eth.id]?.info).toEqual(mockStakingProductInfo());
            expect(state.products[eth.id]?.infoFetchedAt).toBe(1_777_000_000_000);
        });

        it('ignores a product that is not registered', () => {
            const unknown = mockStakingProductDescriptor({ symbol: asNetworkSymbol('ada') });
            const state = stakingReducer(
                registered,
                stakingActions.productInfoFetched({
                    productId: unknown.id,
                    info: mockStakingProductInfo(),
                    fetchedAt: 1,
                }),
            );

            expect(state).toBe(registered);
        });
    });

    describe('positionsSynced', () => {
        const ethPosition = mockStakingPosition();
        const solPosition = mockStakingPosition({ productId: sol.id, lockup: 'liquid' });
        const synced = stakingReducer(
            registered,
            stakingActions.positionsSynced({ accountKey, positions: [ethPosition, solPosition] }),
        );

        it('stores positions by product', () => {
            expect(synced.positions[accountKey]).toEqual({
                [eth.id]: ethPosition,
                [sol.id]: solPosition,
            });
        });

        it('keeps the account map when nothing changed', () => {
            const state = stakingReducer(
                synced,
                stakingActions.positionsSynced({
                    accountKey,
                    positions: [
                        mockStakingPosition({ productId: sol.id, lockup: 'liquid' }),
                        mockStakingPosition(),
                    ],
                }),
            );

            expect(state.positions[accountKey]).toBe(synced.positions[accountKey]);
            expect(state).toBe(synced);
        });

        it('keeps an unchanged position when another one changed', () => {
            const changedSol = mockStakingPosition({ productId: sol.id, lockup: 'locked' });
            const state = stakingReducer(
                synced,
                stakingActions.positionsSynced({
                    accountKey,
                    positions: [mockStakingPosition(), changedSol],
                }),
            );

            expect(state.positions[accountKey]).not.toBe(synced.positions[accountKey]);
            expect(state.positions[accountKey]?.[eth.id]).toBe(
                synced.positions[accountKey]?.[eth.id],
            );
            expect(state.positions[accountKey]?.[sol.id]).toEqual(changedSol);
        });

        it('drops products that stop reporting a position', () => {
            const state = stakingReducer(
                synced,
                stakingActions.positionsSynced({ accountKey, positions: [ethPosition] }),
            );

            expect(Object.keys(state.positions[accountKey] ?? {})).toEqual([eth.id]);
        });

        it('removes the account when no position is left', () => {
            const state = stakingReducer(
                synced,
                stakingActions.positionsSynced({ accountKey, positions: [] }),
            );

            expect(state.positions).toEqual({});
        });

        it('keeps other accounts untouched', () => {
            const state = stakingReducer(
                synced,
                stakingActions.positionsSynced({
                    accountKey: otherAccountKey,
                    positions: [ethPosition],
                }),
            );

            expect(state.positions[accountKey]).toBe(synced.positions[accountKey]);
            expect(state.positions[otherAccountKey]).toEqual({ [eth.id]: ethPosition });
        });
    });

    it('drops the positions of removed accounts only', () => {
        const removed = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
        const kept = mockWalletAccount({ symbol: asNetworkSymbol('sol') });
        const synced = [removed, kept].reduce(
            (state, account) =>
                stakingReducer(
                    state,
                    stakingActions.positionsSynced({
                        accountKey: account.key,
                        positions: [mockStakingPosition()],
                    }),
                ),
            registered,
        );
        const state = stakingReducer(synced, accountsActions.removeAccount([removed]));

        expect(Object.keys(state.positions)).toEqual([kept.key]);
        expect(state.positions[kept.key]).toBe(synced.positions[kept.key]);
    });
});
