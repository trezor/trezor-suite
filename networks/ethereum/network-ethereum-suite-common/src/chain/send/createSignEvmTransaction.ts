import type { GetTrezorConnectDep } from '@trezor/connect-common';
import {
    ChainSendError,
    type ChainSignedTransaction,
    type SignChainTransactionParams,
} from '@trezor/network-module-suite-common-types';

import { prepareEthereumTransaction } from './evm/evmTransaction';
import type { EvmSendAppDeps, EvmSendConfig } from './types';

export type SignEvmTransactionDeps = GetTrezorConnectDep<'ethereumSignTransaction'> &
    Pick<EvmSendAppDeps, 'resolveEvmNonce'>;

export type SignEvmTransactionParams = SignChainTransactionParams & { config: EvmSendConfig };

export type SignEvmTransaction = (
    params: SignEvmTransactionParams,
) => Promise<ChainSignedTransaction>;

/** Signs at the next available nonce, or the user's own nonce when it is still usable. */
export const createSignEvmTransaction =
    (deps: SignEvmTransactionDeps): SignEvmTransaction =>
    async ({ account, draft, precomposed, options, config }) => {
        const { symbol } = account;
        const { chainId } = config;

        if (!chainId) {
            throw new ChainSendError('sign-failed', symbol, 'Ethereum network mismatch.');
        }

        // Re-check the backend right before signing: the confirmed nonce may have advanced since
        // the form was composed (e.g. another wallet/session spent it), so this returns the
        // next available nonce. When a custom nonce is provided, skip rbfParams so we get the
        // actual confirmed nonce for validation instead of the RBF nonce.
        const customNonce = draft.ethereumNonce;
        const { nonce: resolvedNonce, confirmedNonce } = await deps.resolveEvmNonce({
            account,
            rbfParams: customNonce ? undefined : draft.rbfParams,
            fetchConfirmedNonce: true,
        });

        let nonce = resolvedNonce;
        if (customNonce) {
            if (parseInt(customNonce, 10) < parseInt(confirmedNonce, 10)) {
                throw new ChainSendError(
                    'sign-failed',
                    symbol,
                    `Custom nonce ${customNonce} is below the confirmed nonce ${confirmedNonce}.`,
                );
            }
            nonce = customNonce;
        }

        // The exact nonce being signed, so the app shows it without resolving it again (which
        // would race this in-progress signing).
        options.onPrepared?.({ nonce });

        const { outputs: signOutputs } = draft;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstSignOutput: (typeof signOutputs)[number] = signOutputs[0];
        // transform to TrezorConnect.ethereumSignTransaction params
        const transaction = prepareEthereumTransaction({
            token: precomposed.token,
            chainId,
            // Use the resolved onchain address for a named input (e.g. ENS), otherwise the raw input.
            to: firstSignOutput.resolvedAddress ?? firstSignOutput.address,
            amount: firstSignOutput.amount,
            data: draft.transactionData,
            gasLimit: precomposed.feeLimit || '',
            maxFeePerGas: 'maxFeePerGas' in precomposed ? precomposed.maxFeePerGas : undefined,
            maxPriorityFeePerGas:
                'maxPriorityFeePerGas' in precomposed
                    ? precomposed.maxPriorityFeePerGas
                    : undefined,
            gasPrice: precomposed.feePerByte,
            nonce,
            payment_req: options.paymentRequests?.[0],
        });

        const response = await deps.getTrezorConnect().ethereumSignTransaction({
            device: options.device,
            path: account.path,
            transaction,
            chunkify: options.chunkify,
        });

        if (!response.success) {
            throw new ChainSendError(
                'sign-failed',
                symbol,
                response.error.message,
                response.error.code,
            );
        }

        return { serializedTx: response.payload.serializedTx, nonce };
    };
