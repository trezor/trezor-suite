import { type Network, selectSupportedNetworkSymbols } from '@suite-common/networks';
import {
    accountsActions,
    selectAccountForNetworkSymbolAndPath,
    sendFormActions,
} from '@suite-common/wallet-core';
import {
    type Account,
    type FormState,
    type GeneralPrecomposedTransactionFinal,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import type { CallMethodKeys } from '@trezor/connect';
import {
    type Address,
    type DerivationPath,
    type GetAddress,
    type Params,
    type Response,
    getSerializedPath,
    validatePath,
} from '@trezor/connect-common';
import type { Bip43Path } from '@trezor/crypto-utils';

import { CommonPopupFlow, type MaybePromise, type PopupFlowPayload } from './CommonPopupFlow';
import { connectPopupActions } from '../connectPopupActions';
import { getPermissionDeferred } from '../connectPopupPromiseManager';

type SigningAccountNetwork = Pick<Network, 'symbol' | 'name' | 'isHidden'>;

/** Shows the transaction review modal of the Suite send form instead of the generic popup UI. */
export abstract class AbstractSignTransactionFlow<
    M extends CallMethodKeys,
> extends CommonPopupFlow<M> {
    // Placeholder accounts created for the review modal.
    private temporaryAccounts: Account[] = [];

    /** Prepares the review modal and may return an adjusted payload. */
    protected abstract prepareSigning(
        txSigningPrecomposed?: PrecomposedTransactionFinal,
    ): MaybePromise<PopupFlowPayload<M> | void>;

    protected async preCall(txSigningPrecomposed?: PrecomposedTransactionFinal) {
        try {
            return (await this.prepareSigning(txSigningPrecomposed)) ?? this.payload;
        } catch (error) {
            // If an error occurs it's not a problem, we just fall back to generic UI
            console.error('Error in Connect Popup %s hook:', this.method, error);
            if (error.code === 'Method_Cancel') {
                // User cancelled the operation
                throw error;
            }

            return this.payload;
        }
    }

    // Also runs when the call threw before signing, so placeholders cannot leak into a later
    // removeAccount payload. Only this flow's own ones are removed: a cancelled call can still be
    // finishing while the next one is being reviewed.
    cleanup() {
        if (this.temporaryAccounts.length) {
            this.dispatch(accountsActions.removeAccount(this.temporaryAccounts));
            this.temporaryAccounts = [];
        }
    }

    protected selectSigningAccount(path: DerivationPath, network: SigningAccountNetwork) {
        const bip43Path = getSerializedPath(validatePath(path)) as Bip43Path;
        const existingAccount = network.isHidden
            ? undefined
            : selectAccountForNetworkSymbolAndPath(this.getState(), network.symbol, bip43Path);
        const account = existingAccount ?? this.createPlaceholderAccount(bip43Path, network);

        this.dispatch(
            connectPopupActions.setSelectedAccountKey({ selectedAccountKey: account.key }),
        );

        return account;
    }

    private createPlaceholderAccount(path: Bip43Path, network: SigningAccountNetwork) {
        const createAccountAction = accountsActions.createAccount(
            {
                // Real device state not needed, this is also better to differentiate from real
                // accounts
                deviceState: 'placeholder@connect:0',
                index: 0,
                path,
                accountType: 'placeholder',
                symbol: network.symbol,
                accountInfo: {
                    path,
                    descriptor: '',
                    balance: '',
                    availableBalance: '',
                    empty: false,
                    history: { total: 0, unconfirmed: 0 },
                },
                imported: true,
                visible: false,
                accountLabel: network.name,
            },
            selectSupportedNetworkSymbols(this.getState()),
        );
        this.dispatch(createAccountAction);
        this.temporaryAccounts.push(createAccountAction.payload.account);

        return createAccountAction.payload.account;
    }

    protected storePrecomposedTransaction(
        precomposedTransaction: GeneralPrecomposedTransactionFinal,
        formState?: Partial<FormState>,
    ) {
        this.dispatch(
            sendFormActions.storePrecomposedTransaction({
                formState: {
                    // Can be left empty, not used in tx review modal
                    outputs: [],
                    feeLimit: '',
                    feePerUnit: '',
                    selectedUtxos: [],
                    isCoinControlEnabled: false,
                    hasCoinControlBeenOpened: false,
                    selectedFee: 'custom',
                    options: [],
                    ...formState,
                },
                precomposedTransaction,
            }),
        );
    }

    protected async simulateTransaction(
        getAddress: (params: Params<GetAddress>) => Response<Address>,
        path: DerivationPath,
    ) {
        if (this.source.type !== 'desktop-ws' && this.source.type !== 'web') {
            const device = this.getSelectedDevice();
            const accountAddress = await getAddress({ path, device, showOnTrezor: false });
            if (!accountAddress.success) throw new Error(accountAddress.error.message);
            this.dispatch(
                connectPopupActions.txSimulation({
                    fromAddress: accountAddress.payload.address,
                }),
            );
            await getPermissionDeferred(true).promise;
        }
    }
}
