import type { SubscriptionAccountInfo, TokenDetailByMint } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';
import { solanaUtils } from '@trezor/blockchain-link-utils';
import solana from '@trezor/network-solana/runtime';
import type { AccountInfoBase, SolanaRpcResponse } from '@trezor/network-solana/types';

import type { Context } from '../types';
import { isValidTransaction } from '../utils';

const extractTokenAccounts = (
    accounts: SubscriptionAccountInfo[],
    tokenMetadata: TokenDetailByMint,
): SubscriptionAccountInfo[] =>
    accounts.flatMap(
        account =>
            account.tokens?.flatMap(
                token =>
                    token.accounts
                        ?.filter(
                            tokenAccount =>
                                tokenAccount.balance !== '0' && tokenMetadata[token.contract],
                        )
                        .map(tokenAccount => ({ descriptor: tokenAccount.publicKey })) || [],
            ) || [],
    );

const findTokenAccountOwner = (
    accounts: SubscriptionAccountInfo[],
    accountDescriptor: string,
): SubscriptionAccountInfo | undefined =>
    accounts.find(account =>
        account.tokens?.find(token =>
            token.accounts?.find(tokenAccount => tokenAccount.publicKey === accountDescriptor),
        ),
    );

let NEXT_ACCOUNT_SUBSCRIPTION_ID = 0;
// Module-scoped registry of in-flight account subscriptions. Shared between the
// subscribe/unsubscribe handlers and the SolanaWorker `disconnect` method (which
// imports `abortSubscription`). Importers share one Map, which is the pre-existing behaviour.
const ACCOUNT_SUBSCRIPTION_ABORT_CONTROLLERS = new Map<number, AbortController>();
export const abortSubscription = (id: number) => {
    const abortController = ACCOUNT_SUBSCRIPTION_ABORT_CONTROLLERS.get(id);
    ACCOUNT_SUBSCRIPTION_ABORT_CONTROLLERS.delete(id);
    abortController?.abort();
};

const handleAccountNotification = async (
    context: Context,
    accountNotifications: AsyncIterable<SolanaRpcResponse<AccountInfoBase>>,
    account: SubscriptionAccountInfo,
) => {
    const { connect, state, post, getTokenMetadata } = context;
    const { address, isConnectionClosedError } = await solana();
    try {
        for await (const _ of accountNotifications) {
            const api = await connect();
            // get the last transaction signature for the account, since that what triggered this callback
            const [lastSignatureResponse] = await api.rpc
                .getSignaturesForAddress(address(account.descriptor), {
                    limit: 1,
                })
                .send();
            const lastSignature = lastSignatureResponse?.signature;
            if (!lastSignature) return;

            // get the last transaction
            const lastTx = await api.rpc
                .getTransaction(lastSignature, {
                    encoding: 'jsonParsed',
                    maxSupportedTransactionVersion: 0,
                    commitment: 'confirmed',
                })
                .send();

            if (!lastTx || !isValidTransaction(lastTx)) {
                return;
            }

            const tokenMetadata = await getTokenMetadata();
            const tx = solanaUtils.transformTransaction(
                lastTx,
                account.descriptor,
                [],
                tokenMetadata,
            );

            // For token accounts we need to emit an event with the owner account's descriptor
            // since we don't store token accounts in the user's accounts.
            const descriptor =
                findTokenAccountOwner(state.getAccounts(), account.descriptor)?.descriptor ||
                account.descriptor;

            post({
                id: -1,
                type: RESPONSES.NOTIFICATION,
                payload: {
                    type: 'notification',
                    payload: {
                        descriptor,
                        tx,
                    },
                },
            });
        }
    } catch (error) {
        if (isConnectionClosedError(error)) {
            // The WS was closed, we should unsubscribe
            if (account.subscriptionId) abortSubscription(account.subscriptionId);
            state.removeAccounts([account]);
            context.onNetworkDisconnect();
        }
    }
};

export const subscribeAccounts = async (context: Context, accounts: SubscriptionAccountInfo[]) => {
    const { connect, state } = context;
    const api = await connect();
    const subscribedAccounts = state.getAccounts();
    const tokenMetadata = await context.getTokenMetadata();
    const tokenAccounts = extractTokenAccounts(accounts, tokenMetadata);
    // we have to subscribe to both system and token accounts
    const newAccounts = [...accounts, ...tokenAccounts].filter(
        account =>
            !subscribedAccounts.some(
                subscribedAccount => account.descriptor === subscribedAccount.descriptor,
            ),
    );

    const { address } = await solana();

    await Promise.all(
        newAccounts.map(async a => {
            const abortController = new AbortController();
            const accountNotifications = await api.rpcSubscriptions
                .accountNotifications(address(a.descriptor), { commitment: 'confirmed' })
                .subscribe({ abortSignal: abortController.signal });
            const subscriptionId = NEXT_ACCOUNT_SUBSCRIPTION_ID++;
            ACCOUNT_SUBSCRIPTION_ABORT_CONTROLLERS.set(subscriptionId, abortController);
            const account: SubscriptionAccountInfo = {
                ...a,
                subscriptionId,
            };
            state.addAccounts([account]);
            handleAccountNotification(context, accountNotifications, account);
        }),
    );

    return { subscribed: newAccounts.length > 0 };
};

export const unsubscribeAccounts = (
    { state }: Context,
    accounts: SubscriptionAccountInfo[] | undefined = [],
) => {
    const subscribedAccounts = state.getAccounts();

    accounts.forEach(a => {
        if (a.subscriptionId != null) {
            abortSubscription(a.subscriptionId);
            state.removeAccounts([a]);
        }

        // unsubscribe token accounts as well
        a.tokens?.forEach(t => {
            t.accounts?.forEach(ta => {
                const tokenAccount = subscribedAccounts.find(sa => sa.descriptor === ta.publicKey);
                if (tokenAccount?.subscriptionId != null) {
                    abortSubscription(tokenAccount.subscriptionId);
                    state.removeAccounts([tokenAccount]);
                }
            });
        });
    });
};
