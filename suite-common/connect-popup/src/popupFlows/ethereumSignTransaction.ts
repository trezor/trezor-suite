import { isEvmTxSimulationSupported } from '@suite-common/tx-simulation';
import { asNetworkSymbol, getNetworkByEvmChainId } from '@suite-common/wallet-config';
import { type Account, type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { getPrecomposedTxWithAccountToken } from '@suite-common/wallet-utils';
import TrezorConnect, { type MethodInfo } from '@trezor/connect';

import { AbstractSignTransactionFlow } from './AbstractSignTransactionFlow';
import { selectConnectPopupCall } from '../connectPopupReducer';

export class EthereumSignTransaction extends AbstractSignTransactionFlow<'ethereumSignTransaction'> {
    protected async prepareSigning(txSigningPrecomposed?: PrecomposedTransactionFinal) {
        const { path, transaction } = this.payload;
        const chainId = transaction.chainId || 1;
        const account = this.selectSigningAccount(
            path,
            getNetworkByEvmChainId(chainId) || {
                symbol: asNetworkSymbol('eth'),
                name: 'Chain ID: ' + chainId,
                isHidden: true,
            },
        );

        if (txSigningPrecomposed) {
            this.storeEthereumPrecomposedTransaction(txSigningPrecomposed, account);
        }

        // The simulation modal has nothing to render for a chain Blockaid can't scan, so opening it
        // would leave the call waiting on a confirmation the user never sees. Decided from the raw
        // payload, as the simulation is, not from the defaulted chain ID above.
        if (isEvmTxSimulationSupported({ method: this.method, payload: this.payload })) {
            await this.simulateTransaction(TrezorConnect.ethereumGetAddress, path);
        }

        if (this.source.type === 'walletconnect') {
            return this.applySelectedFee(account);
        }
    }

    // Modify payload to include selected fee, if present
    private async applySelectedFee(account: Account) {
        const currentPopupCall = selectConnectPopupCall(this.getState());
        if (
            (currentPopupCall?.state !== 'ongoing' &&
                currentPopupCall?.state !== 'tx-simulation') ||
            !currentPopupCall.selectedFee
        ) {
            return;
        }

        const modifiedPayload = {
            ...this.payload,
            transaction: {
                ...this.payload.transaction,
                ...currentPopupCall.selectedFee,
            },
        };

        // Update precomposed transaction
        const methodInfo = await TrezorConnect.ethereumSignTransaction({
            ...modifiedPayload,
            __info: true,
        });
        if (!methodInfo.success) {
            throw methodInfo.error;
        }
        const { precomposed } = methodInfo.payload as unknown as MethodInfo;
        if (precomposed) {
            this.storeEthereumPrecomposedTransaction(precomposed, account);
        }

        return modifiedPayload;
    }

    private storeEthereumPrecomposedTransaction(
        precomposedTx: PrecomposedTransactionFinal,
        account: Account,
    ) {
        const { transaction } = this.payload;

        this.storePrecomposedTransaction(
            getPrecomposedTxWithAccountToken({
                precomposedTx,
                contract: transaction.to,
                data: transaction.data,
                accountTokens: account.tokens,
            }),
            {
                options: ['ethereumNonce', 'transactionData'],
                transactionData: transaction.data?.replace(/^0x/, ''),
                // The signing payload carries the nonce in hex; show it as a decimal string in the
                // review modal to match the Send flow (otherwise it renders e.g. "0x5").
                ethereumNonce: transaction.nonce
                    ? parseInt(transaction.nonce, 16).toString()
                    : transaction.nonce,
            },
        );
    }
}
