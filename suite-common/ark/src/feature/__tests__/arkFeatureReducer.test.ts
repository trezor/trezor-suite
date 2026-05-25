import { asWalletDescriptor } from '@suite-common/wallet-types';

import {
    type ArkBalance,
    type ArkVtxoView,
    arkActions,
    arkReducer,
    initialArkState,
} from '../arkFeatureReducer';

const walletDescriptor = asWalletDescriptor('wallet-1');

describe('arkFeatureReducer', () => {
    it('has the expected initial state', () => {
        expect(
            arkReducer(undefined, {
                type: 'init',
            }),
        ).toEqual({
            ...initialArkState,
            isEnabled: true,
        });
    });

    it('toggles ark enablement', () => {
        expect(arkReducer(initialArkState, arkActions.setArkEnabled(false))).toEqual({
            ...initialArkState,
            isEnabled: false,
        });
    });

    it('adds an ark account once per wallet and initializes empty wallet state', () => {
        const stateWithAccount = arkReducer(
            initialArkState,
            arkActions.addArkAccount({
                accountNumber: 1,
                walletDescriptor,
            }),
        );

        expect(stateWithAccount.accountsByWalletDescriptor[walletDescriptor]).toEqual([
            {
                accountNumber: 1,
                walletDescriptor,
                walletKey: 'wallet-1:1',
            },
        ]);
        expect(stateWithAccount.selectedAccountNumberByWalletDescriptor[walletDescriptor]).toEqual(
            1,
        );
        expect(stateWithAccount.walletsByKey['wallet-1:1']).toEqual({
            accountNumber: 1,
            balance: null,
            boardingAddress: '',
            error: null,
            lastLoadedAt: null,
            offchainAddress: '',
            status: 'idle',
            vtxos: [],
            walletDescriptor,
            walletKey: 'wallet-1:1',
        });
    });

    it('keeps the account list deduplicated and sorted by account number', () => {
        const accountState = arkReducer(
            arkReducer(
                arkReducer(
                    initialArkState,
                    arkActions.addArkAccount({
                        accountNumber: 2,
                        walletDescriptor,
                    }),
                ),
                arkActions.addArkAccount({
                    accountNumber: 0,
                    walletDescriptor,
                }),
            ),
            arkActions.addArkAccount({
                accountNumber: 2,
                walletDescriptor,
            }),
        );

        expect(
            accountState.accountsByWalletDescriptor[walletDescriptor].map(
                account => account.accountNumber,
            ),
        ).toEqual([0, 2]);
    });

    it('stores loaded wallet state with balance and vtxos', () => {
        const balance: ArkBalance = {
            available: 1000,
            settled: 800,
            preconfirmed: 200,
            boardingConfirmed: 0,
            boardingUnconfirmed: 0,
            recoverable: 0,
            total: 1000,
        };
        const vtxos: ArkVtxoView[] = [
            {
                txid: 'abcd',
                vout: 0,
                amountSats: 1000,
                isSpendable: true,
                isRecoverable: false,
                isExpired: false,
                isSubdust: false,
            },
        ];

        const stateWithAccount = arkReducer(
            initialArkState,
            arkActions.addArkAccount({
                accountNumber: 0,
                walletDescriptor,
            }),
        );
        const loadedState = arkReducer(
            stateWithAccount,
            arkActions.setArkWalletLoaded({
                accountNumber: 0,
                balance,
                boardingAddress: 'bc1q-board',
                offchainAddress: 'ark1q-off',
                vtxos,
                walletDescriptor,
            }),
        );

        expect(loadedState.walletsByKey['wallet-1:0']).toMatchObject({
            balance,
            boardingAddress: 'bc1q-board',
            offchainAddress: 'ark1q-off',
            status: 'loaded',
            vtxos,
        });
    });

    it('records and clears wallet errors', () => {
        const errorState = arkReducer(
            initialArkState,
            arkActions.setArkWalletError({
                accountNumber: 0,
                error: 'boom',
                walletDescriptor,
            }),
        );

        expect(errorState.walletsByKey['wallet-1:0']).toMatchObject({
            error: 'boom',
            status: 'error',
        });

        const clearedState = arkReducer(
            errorState,
            arkActions.clearArkWalletError({
                accountNumber: 0,
                walletDescriptor,
            }),
        );

        expect(clearedState.walletsByKey['wallet-1:0'].error).toBeNull();
    });
});
