import { asWalletDescriptor } from '@suite-common/wallet-types';

import {
    createInitialSparkBalanceSats,
    createInitialSparkTransfers,
    createSparkBitcoinDepositAddress,
    createSparkLightningInvoice,
} from '../../wallet/sparkMockData';
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

    it('adds spark account once per wallet and initializes wallet state', () => {
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
            balanceSats: createInitialSparkBalanceSats(1),
            bitcoinDepositAddress: createSparkBitcoinDepositAddress({
                accountNumber: 1,
                walletDescriptor,
            }),
            error: null,
            lastLoadedAt: null,
            lightningInvoice: createSparkLightningInvoice({
                accountNumber: 1,
                walletDescriptor,
            }),
            mnemonic: null,
            status: 'idle',
            transfers: createInitialSparkTransfers({
                accountNumber: 1,
                walletDescriptor,
            }),
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

    it('records mocked lightning send into history', () => {
        const stateWithAccount = sparkReducer(
            initialSparkState,
            sparkActions.addSparkAccount({
                accountNumber: 0,
                walletDescriptor,
            }),
        );
        const sentState = sparkReducer(
            stateWithAccount,
            sparkActions.submitSparkLightningSend({
                accountNumber: 0,
                amountSats: '1000',
                invoice: 'lnbc1destination',
                walletDescriptor,
            }),
        );

        expect(sentState.walletsByKey['wallet-1:0'].balanceSats).toEqual('249000');
        expect(sentState.walletsByKey['wallet-1:0'].transfers[0]).toEqual(
            expect.objectContaining({
                amountSats: '1000',
                counterparty: 'lnbc1destination',
                direction: 'send',
                rail: 'lightning',
            }),
        );
    });
});
