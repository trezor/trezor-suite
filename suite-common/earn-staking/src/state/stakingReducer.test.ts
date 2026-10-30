import {
    mockStakingPosition,
    mockStakingProductDescriptor,
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

describe('stakingReducer', () => {
    it('starts without a platform, products or positions', () => {
        expect(stakingReducer(undefined, { type: 'init' })).toEqual(stakingInitialState);
    });

    describe('productsRegistered', () => {
        it('stores the platform and the descriptors', () => {
            expect(registered.platform).toBe('desktop');
            expect(registered.products).toEqual({ [eth.id]: eth, [sol.id]: sol });
        });

        it('replaces the descriptors when products are registered again', () => {
            const updatedEth = mockStakingProductDescriptor({ rateKind: 'apr' });
            const state = stakingReducer(
                registered,
                stakingActions.productsRegistered({
                    platform: 'mobile',
                    descriptors: [updatedEth],
                }),
            );

            expect(state.platform).toBe('mobile');
            expect(state.products).toEqual({ [eth.id]: updatedEth });
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
