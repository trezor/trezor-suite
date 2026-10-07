import type { GetTrezorConnectDep, PROTO } from '@trezor/connect-common';
import {
    ChainSendError,
    type ChainSignedTransaction,
    type GeneralPrecomposedTransactionFinal,
    type PrecomposedTransactionCardanoFinal,
    type SignChainTransactionParams,
} from '@trezor/network-module-suite-common-types';

import { getDerivationType, getNetworkId, getProtocolMagic } from './cardanoSendUtils';
import type { CardanoSendConfig } from './types';

// `PROTO.CardanoTxSigningMode.ORDINARY_TRANSACTION` by value, without Connect's protobuf runtime.
const ORDINARY_TRANSACTION_SIGNING_MODE = 0 as PROTO.CardanoTxSigningMode.ORDINARY_TRANSACTION;

export type SignCardanoTransactionDeps = GetTrezorConnectDep<'cardanoSignTransaction'>;

export type SignCardanoTransactionParams = SignChainTransactionParams & {
    config: CardanoSendConfig;
};

export type SignCardanoTransaction = (
    params: SignCardanoTransactionParams,
) => Promise<ChainSignedTransaction>;

const isCardanoPrecomposed = (
    tx: GeneralPrecomposedTransactionFinal,
): tx is PrecomposedTransactionCardanoFinal => 'unsignedTx' in tx;

/** Signs the transaction coin selection built, as an ordinary Cardano transaction. */
export const createSignCardanoTransaction =
    (deps: SignCardanoTransactionDeps): SignCardanoTransaction =>
    async ({ account, precomposed, options, config }) => {
        const { symbol } = account;

        if (!isCardanoPrecomposed(precomposed)) {
            throw new ChainSendError('sign-failed', symbol, 'Invalid input data.');
        }

        const response = await deps.getTrezorConnect().cardanoSignTransaction({
            signingMode: ORDINARY_TRANSACTION_SIGNING_MODE,
            device: options.device,
            inputs: precomposed.inputs,
            outputs: precomposed.outputs,
            unsignedTx: precomposed.unsignedTx,
            tagCborSets: true,
            testnet: config.isTestnet,
            protocolMagic: getProtocolMagic(symbol),
            networkId: getNetworkId(),
            fee: precomposed.fee,
            ttl: precomposed.ttl?.toString(),
            derivationType: getDerivationType(account.accountType),
            payment_req: options.paymentRequests?.[0],
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

        return { serializedTx: response.payload.serializedTx };
    };
