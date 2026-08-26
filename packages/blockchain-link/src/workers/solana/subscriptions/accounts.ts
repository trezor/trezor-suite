import type { SubscriptionAccountInfo, TokenDetailByMint } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';
import { solanaUtils } from '@trezor/blockchain-link-utils';
import { tokenProgramsInfo } from '@trezor/network-solana/constants';
import solana from '@trezor/network-solana/runtime';
import type { AccountInfoWithJsonData, Base58EncodedBytes } from '@trezor/network-solana/types';

import type { Context } from '../types';
import { isValidTransaction } from '../utils';

// Offset of the owner pubkey in the SPL token account layout, shared by Token and Token-2022.
const TOKEN_ACCOUNT_OWNER_OFFSET = 32n;

const getTokenAccountMint = (account: AccountInfoWithJsonData) =>
    'parsed' in account.data
        ? (account.data.parsed?.info as { mint?: string } | undefined)?.mint
        : undefined;

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

const handleNotifications = async <T>(
    context: Context,
    notifications: AsyncIterable<T>,
    account: SubscriptionAccountInfo,
    // Address whose history changed, or undefined to ignore the notification.
    getChangedAddress: (notification: T, tokenMetadata: TokenDetailByMint) => string | undefined,
) => {
    const { connect, state, post, getTokenMetadata } = context;
    const { address, isConnectionClosedError } = await solana();
    try {
        for await (const notification of notifications) {
            const tokenMetadata = await getTokenMetadata();
            const changedAddress = getChangedAddress(notification, tokenMetadata);
            if (!changedAddress) continue;

            const api = await connect();
            // get the last transaction signature for the account, since that what triggered this callback
            const [lastSignatureResponse] = await api.rpc
                .getSignaturesForAddress(address(changedAddress), {
                    limit: 1,
                })
                .send();
            const lastSignature = lastSignatureResponse?.signature;
            if (!lastSignature) continue;

            // get the last transaction
            const lastTx = await api.rpc
                .getTransaction(lastSignature, {
                    encoding: 'jsonParsed',
                    maxSupportedTransactionVersion: 0,
                    commitment: 'confirmed',
                })
                .send();

            if (!lastTx || !isValidTransaction(lastTx)) continue;

            // Transformed from the perspective of the address that changed: for a token transfer
            // that is the token account appearing as the instruction's source or destination.
            const tx = solanaUtils.transformTransaction(lastTx, changedAddress, [], tokenMetadata);

            post({
                id: -1,
                type: RESPONSES.NOTIFICATION,
                payload: {
                    type: 'notification',
                    payload: {
                        descriptor: account.descriptor,
                        tx,
                    },
                },
            });
        }
    } catch (error) {
        if (isConnectionClosedError(error)) {
            // The WS was closed, we should unsubscribe
            if (account.subscriptionId != null) abortSubscription(account.subscriptionId);
            state.removeAccounts([account]);
            context.onNetworkDisconnect();
        }
    }
};

export const subscribeAccounts = async (context: Context, accounts: SubscriptionAccountInfo[]) => {
    const { connect, state } = context;
    const api = await connect();
    const subscribedAccounts = state.getAccounts();
    const newAccounts = accounts.filter(
        account =>
            !subscribedAccounts.some(
                subscribedAccount => account.descriptor === subscribedAccount.descriptor,
            ),
    );

    const { address } = await solana();

    await Promise.all(
        newAccounts.map(async a => {
            // One controller per account, shared by its system and token subscriptions.
            const abortController = new AbortController();
            const subscriptionId = NEXT_ACCOUNT_SUBSCRIPTION_ID++;
            ACCOUNT_SUBSCRIPTION_ABORT_CONTROLLERS.set(subscriptionId, abortController);
            const account: SubscriptionAccountInfo = {
                ...a,
                subscriptionId,
            };
            state.addAccounts([account]);

            const accountNotifications = await api.rpcSubscriptions
                .accountNotifications(address(a.descriptor), { commitment: 'confirmed' })
                .subscribe({ abortSignal: abortController.signal });
            handleNotifications(context, accountNotifications, account, () => a.descriptor);

            // One owner-filtered program subscription covers every token account, so the
            // subscription count scales with accounts rather than with tokens held. It also
            // catches token accounts created after subscribing, which a per-token-account
            // subscription cannot — an incoming transfer of a not-yet-held token.
            await Promise.all(
                Object.values(tokenProgramsInfo).map(async ({ publicKey }) => {
                    const tokenNotifications = await api.rpcSubscriptions
                        .programNotifications(address(publicKey), {
                            commitment: 'confirmed',
                            encoding: 'jsonParsed',
                            filters: [
                                {
                                    memcmp: {
                                        bytes: a.descriptor as Base58EncodedBytes,
                                        encoding: 'base58',
                                        offset: TOKEN_ACCOUNT_OWNER_OFFSET,
                                    },
                                },
                            ],
                        })
                        .subscribe({ abortSignal: abortController.signal });

                    handleNotifications(
                        context,
                        tokenNotifications,
                        account,
                        ({ value }, tokenMetadata) => {
                            const mint = getTokenAccountMint(value.account);

                            // Ignore unrecognised tokens so airdropped spam does not trigger a
                            // history fetch and an account refresh.
                            return mint && tokenMetadata[mint] ? value.pubkey : undefined;
                        },
                    );
                }),
            );
        }),
    );

    return { subscribed: newAccounts.length > 0 };
};

export const unsubscribeAccounts = (
    { state }: Context,
    accounts: SubscriptionAccountInfo[] | undefined = [],
) => {
    accounts.forEach(({ descriptor }) => {
        // The accounts Suite sends back carry no subscriptionId, so take the stored one.
        const subscribed = state.getAccount(descriptor);
        if (subscribed?.subscriptionId != null) {
            abortSubscription(subscribed.subscriptionId);
            state.removeAccounts([subscribed]);
        }
    });
};
