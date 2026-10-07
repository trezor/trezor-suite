import type { GetTrezorConnectDep } from '@trezor/connect-common';

import { toCoinSymbol } from '../toCoinSymbol';
import type { PushChainTransactionParams, PushedChainTransaction } from './ChainSend';
import { ChainSendError } from './ChainSendError';
import { toMevProtectedPushData } from './toMevProtectedPushData';

export type PushConnectTransactionDeps = GetTrezorConnectDep<'pushTransaction'>;

export type PushConnectTransactionParams = PushChainTransactionParams & {
    useConnectionIdentity: boolean;
};

export type PushConnectTransaction = (
    params: PushConnectTransactionParams,
) => Promise<PushedChainTransaction>;

// The backend rejects a replacement whose nonce or inputs are taken by another pending transaction.
const PENDING_CONFLICT_MESSAGE = 'could not replace existing tx';

/** Broadcasts a signed transaction through Connect, whatever backend Connect is set to. */
export const createPushConnectTransaction =
    (deps: PushConnectTransactionDeps): PushConnectTransaction =>
    async params => {
        const { account } = params;

        const result = await deps.getTrezorConnect().pushTransaction({
            tx: toMevProtectedPushData(params.serializedTx, params.isMevProtectionEnabled),
            coin: toCoinSymbol(account.symbol),
            identity: params.useConnectionIdentity ? account.deviceState : undefined,
        });

        if (!result.success) {
            const { message, code } = result.error;

            throw new ChainSendError(
                message.includes(PENDING_CONFLICT_MESSAGE)
                    ? 'push-pending-conflict'
                    : 'push-failed',
                account.symbol,
                message,
                code,
            );
        }

        return { txid: result.payload.txid };
    };
