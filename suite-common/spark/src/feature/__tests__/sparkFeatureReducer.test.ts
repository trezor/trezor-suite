import { asWalletDescriptor } from '@suite-common/wallet-types';

import { initialSparkState, sparkActions, sparkReducer } from '../sparkFeatureReducer';

const walletDescriptor = asWalletDescriptor('wallet-1');

describe('sparkFeatureReducer', () => {
    it('has the expected initial state', () => {
        expect(
            sparkReducer(undefined, {
                type: 'init',
            }),
        ).toEqual(initialSparkState);
    });

    it('toggles spark enablement', () => {
        expect(sparkReducer(initialSparkState, sparkActions.setSparkEnabled(true))).toEqual({
            ...initialSparkState,
            isEnabled: true,
        });
    });

    it('adds spark account once per wallet and initializes empty wallet state', () => {
        const stateWithAccount = sparkReducer(
            initialSparkState,
            sparkActions.addSparkAccount({
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
            balanceSats: null,
            bitcoinDepositAddress: '',
            error: null,
            lastLoadedAt: null,
            lightningInvoice: '',
            mnemonic: null,
            status: 'idle',
            transfers: [],
            walletDescriptor,
            walletKey: 'wallet-1:1',
        });
    });

    it('keeps account list deduplicated and sorted', () => {
        const accountState = sparkReducer(
            sparkReducer(
                sparkReducer(
                    initialSparkState,
                    sparkActions.addSparkAccount({
                        accountNumber: 2,
                        walletDescriptor,
                    }),
                ),
                sparkActions.addSparkAccount({
                    accountNumber: 0,
                    walletDescriptor,
                }),
            ),
            sparkActions.addSparkAccount({
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

    it('stores loaded wallet state', () => {
        const stateWithAccount = sparkReducer(
            initialSparkState,
            sparkActions.addSparkAccount({
                accountNumber: 0,
                walletDescriptor,
            }),
        );
        const loadedState = sparkReducer(
            stateWithAccount,
            sparkActions.setSparkWalletLoaded({
                accountNumber: 0,
                balanceSats: '123',
                mnemonic: 'test mnemonic' as never,
                walletDescriptor,
            }),
        );

        expect(loadedState.walletsByKey['wallet-1:0']).toEqual(
            expect.objectContaining({
                balanceSats: '123',
                error: null,
                mnemonic: 'test mnemonic',
                status: 'loaded',
            }),
        );
        expect(loadedState.walletsByKey['wallet-1:0'].lastLoadedAt).not.toBeNull();
    });

    it('stores receive details without changing loaded wallet data', () => {
        const stateWithAccount = sparkReducer(
            initialSparkState,
            sparkActions.addSparkAccount({
                accountNumber: 0,
                walletDescriptor,
            }),
        );
        const receiveDetailsState = sparkReducer(
            stateWithAccount,
            sparkActions.setSparkWalletReceiveDetails({
                accountNumber: 0,
                bitcoinDepositAddress: 'bc1qaddress',
                lightningInvoice: 'lnbc1invoice',
                walletDescriptor,
            }),
        );

        expect(receiveDetailsState.walletsByKey['wallet-1:0']).toEqual(
            expect.objectContaining({
                bitcoinDepositAddress: 'bc1qaddress',
                lightningInvoice: 'lnbc1invoice',
                status: 'idle',
            }),
        );
    });

    it('stores wallet error state', () => {
        const stateWithAccount = sparkReducer(
            initialSparkState,
            sparkActions.addSparkAccount({
                accountNumber: 0,
                walletDescriptor,
            }),
        );
        const errorState = sparkReducer(
            stateWithAccount,
            sparkActions.setSparkWalletError({
                accountNumber: 0,
                error: 'Spark unavailable',
                walletDescriptor,
            }),
        );

        expect(errorState.walletsByKey['wallet-1:0']).toEqual(
            expect.objectContaining({
                error: 'Spark unavailable',
                status: 'error',
            }),
        );
    });
});
