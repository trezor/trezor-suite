import { getTokenSize } from '@solana-program/token';
import {
    address,
    assertTransactionIsFullySigned,
    ClusterUrl,
    createDefaultRpcTransport,
    createSolanaRpcFromTransport,
    createSolanaRpcSubscriptions,
    decompileTransactionMessage,
    getBase16Encoder,
    getBase64Encoder,
    getCompiledTransactionMessageDecoder,
    getSignatureFromTransaction,
    getTransactionDecoder,
    isDurableNonceTransaction,
    isSolanaError,
    mainnet,
    pipe,
    RpcMainnet,
    RpcSubscriptionsMainnet,
    sendAndConfirmTransactionFactory,
    Signature,
    Slot,
    SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED,
    SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_FAILED_TO_CONNECT,
    SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CONNECTION_CLOSED,
    SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR,
    SolanaRpcApiMainnet,
    SolanaRpcSubscriptionsApi,
    TransactionWithBlockhashLifetime,
    AccountInfoBase,
    SolanaRpcResponse,
} from '@solana/web3.js';

import type {
    Response,
    AccountInfo,
    Transaction,
    SubscriptionAccountInfo,
    TokenInfo,
} from '@trezor/blockchain-link-types';
import type {
    SolanaValidParsedTxWithMeta,
    ParsedTransactionWithMeta,
    SolanaTokenAccountInfo,
    TokenDetailByMint,
} from '@trezor/blockchain-link-types/src/solana';
import type * as MessageTypes from '@trezor/blockchain-link-types/src/messages';
import { CustomError } from '@trezor/blockchain-link-types/src/constants/errors';
import { MESSAGES, RESPONSES } from '@trezor/blockchain-link-types/src/constants';
import { solanaUtils } from '@trezor/blockchain-link-utils';
import { BigNumber, createLazy } from '@trezor/utils';
import {
    transformTokenInfo,
    TOKEN_PROGRAM_PUBLIC_KEY,
} from '@trezor/blockchain-link-utils/src/solana';
import { getSuiteVersion } from '@trezor/env-utils';
import { IntervalId } from '@trezor/type-utils';

import { getBaseFee, getPriorityFee } from './fee';
import { BaseWorker, ContextType, CONTEXT } from '../baseWorker';

export type SolanaAPI = Readonly<{
    clusterUrl: ClusterUrl;
    rpc: RpcMainnet<SolanaRpcApiMainnet>;
    rpcSubscriptions: RpcSubscriptionsMainnet<SolanaRpcSubscriptionsApi>;
}>;

type Context = ContextType<SolanaAPI> & {
    getTokenMetadata: () => Promise<TokenDetailByMint>;
    onNetworkDisconnect: () => void;
};
type Request<T> = T & Context;

type SignatureWithSlot = {
    signature: Signature;
    slot: Slot;
};

function nonNullable<T>(value: T): value is NonNullable<T> {
    return value !== null && value !== undefined;
}

const getAllSignatures = async (
    api: SolanaAPI,
    descriptor: MessageTypes.GetAccountInfo['payload']['descriptor'],
    fullHistory = true,
) => {
    let lastSignature: SignatureWithSlot | undefined;
    let keepFetching = true;
    let allSignatures: SignatureWithSlot[] = [];

    const limit = 100;
    while (keepFetching) {
        const signaturesInfos = await api.rpc
            .getSignaturesForAddress(address(descriptor), {
                before: lastSignature?.signature,
                limit,
            })
            .send();

        const signatures = signaturesInfos.map(info => ({
            signature: info.signature,
            slot: info.slot,
        }));
        lastSignature = signatures[signatures.length - 1];
        keepFetching = signatures.length === limit && fullHistory;
        allSignatures = [...allSignatures, ...signatures];
    }

    return allSignatures;
};

const fetchTransactionPage = async (
    api: SolanaAPI,
    signatures: Signature[],
): Promise<ParsedTransactionWithMeta[]> => {
    return (
        await Promise.all(
            signatures.map(signature =>
                api.rpc
                    .getTransaction(signature, {
                        encoding: 'jsonParsed',
                        maxSupportedTransactionVersion: 0,
                        commitment: 'confirmed',
                    })
                    .send(),
            ),
        )
    ).filter(nonNullable);
};

const isValidTransaction = (tx: ParsedTransactionWithMeta): tx is SolanaValidParsedTxWithMeta =>
    !!(tx && tx.meta && tx.transaction && tx.blockTime);

const pushTransaction = async (request: Request<MessageTypes.PushTransaction>) => {
    const rawTx = request.payload.startsWith('0x') ? request.payload.slice(2) : request.payload;
    const api = await request.connect();

    const txByteArray = getBase16Encoder().encode(rawTx);
    const transaction = getTransactionDecoder().decode(txByteArray);
    assertTransactionIsFullySigned(transaction);

    const compiledMessage = getCompiledTransactionMessageDecoder().decode(transaction.messageBytes);
    const message = decompileTransactionMessage(compiledMessage);
    if (isDurableNonceTransaction(message)) {
        // TODO: Handle durable nonce transactions.
        throw new Error('Unimplemented: Confirming durable nonce transactions');
    }

    let transactionWithBlockhashLifetime = transaction as typeof transaction &
        TransactionWithBlockhashLifetime;

    // If lifetimeConstraint is not provided, fetch the latest blockhash and lastValidBlockHeight
    if (message.lifetimeConstraint === undefined) {
        const {
            value: { blockhash, lastValidBlockHeight },
        } = await api.rpc.getLatestBlockhash({ commitment: 'finalized' }).send();
        transactionWithBlockhashLifetime = {
            ...transactionWithBlockhashLifetime,
            lifetimeConstraint: { blockhash, lastValidBlockHeight },
        };
    } else {
        transactionWithBlockhashLifetime = {
            ...transactionWithBlockhashLifetime,
            lifetimeConstraint: message.lifetimeConstraint,
        };
    }

    try {
        const signature = getSignatureFromTransaction(transaction);
        const sendAndConfirmTransaction = sendAndConfirmTransactionFactory(api);
        await sendAndConfirmTransaction(transactionWithBlockhashLifetime, {
            commitment: 'confirmed',
            skipPreflight: false,
        });

        return {
            type: RESPONSES.PUSH_TRANSACTION,
            payload: signature,
        } as const;
    } catch (error) {
        if (isSolanaError(error, SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED)) {
            throw new Error(
                'Please make sure that you submit the transaction within 1 minute after signing.',
            );
        }
        if (
            isSolanaError(error, SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_FAILED_TO_CONNECT) ||
            isSolanaError(error, SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CONNECTION_CLOSED) ||
            isSolanaError(error, SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR)
        ) {
            throw new Error(
                'Solana backend connection failure. The backend might be inaccessible or the connection is unstable.',
            );
        }
        if (isSolanaError(error)) {
            throw new Error(
                `Solana error code: ${error.context.__code}. Please try again or contact support.`,
            );
        }
        throw error;
    }
};

const getAccountInfo = async (request: Request<MessageTypes.GetAccountInfo>) => {
    const { payload } = request;
    const { details = 'basic' } = payload;
    const api = await request.connect();

    const publicKey = address(payload.descriptor);

    const getAllTxIds = async (tokenAccountPubkeys: string[]) => {
        const sortedTokenAccountPubkeys = tokenAccountPubkeys.sort();

        const allAccounts = [payload.descriptor, ...sortedTokenAccountPubkeys];

        const allTxIds =
            details === 'basic' || details === 'txs' || details === 'txids'
                ? Array.from(
                      new Set(
                          (
                              await Promise.all(
                                  allAccounts.map(account =>
                                      getAllSignatures(api, account, details !== 'basic'),
                                  ),
                              )
                          )
                              .flat()
                              .sort((a, b) => Number(b.slot - a.slot))
                              .map(it => it.signature),
                      ),
                  )
                : [];

        return allTxIds;
    };

    if (details === 'txids') {
        const txids = await getAllTxIds(request.payload.tokenAccountsPubKeys || []);

        const account: AccountInfo = {
            descriptor: payload.descriptor,
            balance: '0',
            availableBalance: '0',
            empty: txids.length === 0,
            history: {
                total: txids.length,
                unconfirmed: 0,
                txids,
            },
        };

        return {
            type: RESPONSES.GET_ACCOUNT_INFO,
            payload: account,
        } as const;
    }

    const getTransactionPage = async (
        txIds: Signature[],
        tokenAccountsInfos: SolanaTokenAccountInfo[],
    ) => {
        if (txIds.length === 0) {
            return [];
        }
        const transactionsPage = await fetchTransactionPage(api, txIds);

        const tokenMetadata = await request.getTokenMetadata();

        return transactionsPage
            .filter(isValidTransaction)
            .map(tx =>
                solanaUtils.transformTransaction(
                    tx,
                    payload.descriptor,
                    tokenAccountsInfos,
                    tokenMetadata,
                ),
            )
            .filter((tx): tx is Transaction => !!tx);
    };

    const tokenAccounts = await api.rpc
        .getTokenAccountsByOwner(
            publicKey,
            { programId: address(TOKEN_PROGRAM_PUBLIC_KEY) } /* filter */,
            {
                encoding: 'jsonParsed',
            },
        )
        .send();

    const allTxIds = await getAllTxIds(tokenAccounts.value.map(a => a.pubkey));

    const pageNumber = payload.page ? payload.page - 1 : 0;
    // for the first page of txs, payload.page is undefined, for the second page is 2
    const pageSize = payload.pageSize || 5;

    const pageStartIndex = pageNumber * pageSize;
    const pageEndIndex = Math.min(pageStartIndex + pageSize, allTxIds.length);

    const txIdPage = allTxIds.slice(pageStartIndex, pageEndIndex);

    const tokenAccountsInfos = tokenAccounts.value.map(a => ({
        address: a.pubkey,
        mint: a.account.data.parsed?.info?.mint as string | undefined,
        decimals: a.account.data.parsed?.info?.tokenAmount?.decimals as number | undefined,
    }));

    const transactionPage =
        details === 'txs' ? await getTransactionPage(txIdPage, tokenAccountsInfos) : undefined;

    // Fetch token info only if the account owns tokens
    let tokens: TokenInfo[] = [];
    if (tokenAccounts.value.length > 0) {
        const tokenMetadata = await request.getTokenMetadata();

        tokens = transformTokenInfo(tokenAccounts.value, tokenMetadata);
    }

    const { value: balance } = await api.rpc.getBalance(publicKey).send();

    let misc: AccountInfo['misc'] | undefined;
    // Not necessary for basic details
    if (details !== 'basic') {
        // https://solana.stackexchange.com/a/13102
        const { value: accountInfo } = await api.rpc
            .getAccountInfo(publicKey, { encoding: 'base64' })
            .send();
        if (accountInfo) {
            const [accountDataEncoded] = accountInfo.data;
            const accountDataBytes = getBase64Encoder().encode(accountDataEncoded);
            const accountDataLength = BigInt(accountDataBytes.byteLength);
            const rent = await api.rpc.getMinimumBalanceForRentExemption(accountDataLength).send();
            misc = {
                owner: accountInfo?.owner,
                rent: Number(rent),
            };
        }
    }

    // allTxIds can be empty for non-archive rpc nodes
    const isAccountEmpty = !(allTxIds.length || balance || tokens.length);

    const account: AccountInfo = {
        descriptor: payload.descriptor,
        balance: balance.toString(),
        availableBalance: balance.toString(),
        empty: isAccountEmpty,
        history: {
            total: allTxIds.length,
            unconfirmed: 0,
            transactions: transactionPage,
            txids: txIdPage,
        },
        page: transactionPage
            ? {
                  total: allTxIds.length,
                  index: pageNumber,
                  size: transactionPage.length,
              }
            : undefined,
        tokens,
        ...(misc ? { misc } : {}),
    };

    // Update token accounts of account stored by the worker since new accounts
    // might have been created. We otherwise would not get proper updates for new
    // token accounts.
    const workerAccount = request.state.getAccount(payload.descriptor);
    if (workerAccount) {
        request.state.addAccounts([{ ...workerAccount, tokens }]);
    }

    return {
        type: RESPONSES.GET_ACCOUNT_INFO,
        payload: account,
    } as const;
};

const getInfo = async (request: Request<MessageTypes.GetInfo>, isTestnet: boolean) => {
    const api = await request.connect();
    const {
        value: { blockhash: blockHash, lastValidBlockHeight: blockHeight },
    } = await api.rpc.getLatestBlockhash({ commitment: 'finalized' }).send();

    const serverInfo = {
        testnet: isTestnet,
        blockHeight: Number(blockHeight),
        blockHash,
        shortcut: isTestnet ? 'dsol' : 'sol',
        url: api.clusterUrl,
        name: 'Solana',
        version: (await api.rpc.getVersion().send())['solana-core'],
        decimals: 9,
    };

    return {
        type: RESPONSES.GET_INFO,
        payload: { ...serverInfo },
    } as const;
};

const estimateFee = async (request: Request<MessageTypes.EstimateFee>) => {
    const api = await request.connect();

    const messageHex = request.payload.specific?.data;
    const isCreatingAccount = request.payload.specific?.isCreatingAccount;

    if (messageHex == null) {
        throw new Error('Could not estimate fee for transaction.');
    }
    const transaction = pipe(messageHex, getBase16Encoder().encode, getTransactionDecoder().decode);
    const message = pipe(transaction.messageBytes, getCompiledTransactionMessageDecoder().decode);

    const priorityFee = await getPriorityFee(api.rpc, message, transaction.signatures);
    const baseFee = await getBaseFee(api.rpc, message);
    const accountCreationFee = isCreatingAccount
        ? await api.rpc.getMinimumBalanceForRentExemption(BigInt(getTokenSize())).send()
        : BigInt(0);

    const payload = [
        {
            feePerTx: new BigNumber(baseFee.toString())
                .plus(priorityFee.fee)
                .plus(accountCreationFee.toString())
                .toString(10),
            feePerUnit: priorityFee.computeUnitPrice,
            feeLimit: priorityFee.computeUnitLimit,
        },
    ];

    return {
        type: RESPONSES.ESTIMATE_FEE,
        payload,
    } as const;
};

// Solana block validity is about 60 seconds (150*400ms), so we add a bit of margin
const BLOCK_SUBSCRIBE_INTERVAL_MS = 50000;
const subscribeBlock = async ({ state, connect, post }: Context) => {
    if (state.getSubscription('block')) return { subscribed: true };
    const api = await connect();

    const fetchBlock = async () => {
        const {
            value: { blockhash: blockHash, lastValidBlockHeight: blockHeight },
        } = await api.rpc.getLatestBlockhash({ commitment: 'finalized' }).send();
        if (blockHeight) {
            post({
                id: -1,
                type: RESPONSES.NOTIFICATION,
                payload: {
                    type: 'block',
                    payload: {
                        blockHeight: Number(blockHeight),
                        blockHash,
                    },
                },
            });
        }
    };
    fetchBlock();

    // the solana RPC api has subscribe method, see here: https://www.quicknode.com/docs/solana/rootSubscribe
    // but solana block height is updated so often that it slows down the whole application and overloads the the api
    // so we instead use setInterval to check for new blocks every `BLOCK_SUBSCRIBE_INTERVAL_MS`
    const interval = setInterval(fetchBlock, BLOCK_SUBSCRIBE_INTERVAL_MS);
    // we save the interval in the state so we can clear it later
    state.addSubscription('block', interval);

    return { subscribed: true };
};

const unsubscribeBlock = ({ state }: Context) => {
    if (!state.getSubscription('block')) return;
    const interval = state.getSubscription('block') as IntervalId;
    clearInterval(interval);
    state.removeSubscription('block');
};

const extractTokenAccounts = (accounts: SubscriptionAccountInfo[]): SubscriptionAccountInfo[] =>
    accounts
        .map(account =>
            (
                account.tokens?.map(
                    token =>
                        token.accounts?.map(tokenAccount => ({
                            descriptor: tokenAccount.publicKey,
                        })) || [],
                ) || []
            ).flat(),
        )
        .flat();

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
const ACCOUNT_SUBSCRIPTION_ABORT_CONTROLLERS = new Map<number, AbortController>();
function abortSubscription(id: number) {
    const abortController = ACCOUNT_SUBSCRIPTION_ABORT_CONTROLLERS.get(id);
    ACCOUNT_SUBSCRIPTION_ABORT_CONTROLLERS.delete(id);
    abortController?.abort();
}

const handleAccountNotification = async (
    context: Context,
    accountNotifications: AsyncIterable<SolanaRpcResponse<AccountInfoBase>>,
    account: SubscriptionAccountInfo,
) => {
    const { connect, state, post, getTokenMetadata } = context;
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
        console.error('Solana subscription error:', error);
        if (isSolanaError(error, SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CONNECTION_CLOSED)) {
            // The WS was closed, we should unsubscribe
            if (account.subscriptionId) abortSubscription(account.subscriptionId);
            state.removeAccounts([account]);
            context.onNetworkDisconnect();
        }
    }
};

const subscribeAccounts = async (context: Context, accounts: SubscriptionAccountInfo[]) => {
    const { connect, state } = context;
    const api = await connect();
    const subscribedAccounts = state.getAccounts();
    const tokenAccounts = extractTokenAccounts(accounts);
    // we have to subscribe to both system and token accounts
    const newAccounts = [...accounts, ...tokenAccounts].filter(
        account =>
            !subscribedAccounts.some(
                subscribedAccount => account.descriptor === subscribedAccount.descriptor,
            ),
    );
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

const unsubscribeAccounts = (
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

const subscribe = async (request: Request<MessageTypes.Subscribe>) => {
    let response: { subscribed: boolean };
    switch (request.payload.type) {
        case 'block':
            response = await subscribeBlock(request);
            break;
        case 'accounts':
            response = await subscribeAccounts(request, request.payload.accounts);
            break;
        default:
            throw new CustomError('worker_unknown_request', `+${request.type}`);
    }

    return {
        type: RESPONSES.SUBSCRIBE,
        payload: response,
    } as const;
};

const unsubscribe = (request: Request<MessageTypes.Unsubscribe>) => {
    switch (request.payload.type) {
        case 'block':
            unsubscribeBlock(request);
            break;
        case 'accounts': {
            unsubscribeAccounts(request, request.payload.accounts);
            break;
        }
        default:
            throw new CustomError('worker_unknown_request', `+${request.type}`);
    }

    return {
        type: RESPONSES.UNSUBSCRIBE,
        payload: { subscribed: request.state.getAccounts().length > 0 },
    } as const;
};

const onRequest = (request: Request<MessageTypes.Message>, isTestnet: boolean) => {
    switch (request.type) {
        case MESSAGES.GET_ACCOUNT_INFO:
            return getAccountInfo(request);
        case MESSAGES.GET_INFO:
            return getInfo(request, isTestnet);
        case MESSAGES.PUSH_TRANSACTION:
            return pushTransaction(request);
        case MESSAGES.ESTIMATE_FEE:
            return estimateFee(request);
        case MESSAGES.SUBSCRIBE:
            return subscribe(request);
        case MESSAGES.UNSUBSCRIBE:
            return unsubscribe(request);
        default:
            throw new CustomError('worker_unknown_request', `+${request.type}`);
    }
};

class SolanaWorker extends BaseWorker<SolanaAPI> {
    protected isConnected(api: SolanaAPI | undefined): api is SolanaAPI {
        return !!api;
    }

    private lazyTokens = createLazy(() => solanaUtils.getTokenMetadata());
    private isTestnet = false;

    async tryConnect(url: string): Promise<SolanaAPI> {
        const clusterUrl = mainnet(url);
        const transport = createDefaultRpcTransport({
            url: clusterUrl,
            headers: {
                'User-Agent': `Trezor Suite ${getSuiteVersion()}`,
            },
        });

        const api = {
            clusterUrl,
            rpc: createSolanaRpcFromTransport(transport),
            rpcSubscriptions: createSolanaRpcSubscriptions(mainnet(url.replace('http', 'ws'))),
        };

        // genesisHash is reliable identifier of the network, for mainnet the genesis hash is 5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d
        this.isTestnet =
            (await api.rpc.getGenesisHash().send()) !==
            '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d';

        this.post({ id: -1, type: RESPONSES.CONNECTED });

        return api;
    }

    async messageHandler(event: { data: MessageTypes.Message }) {
        try {
            // skip processed messages
            if (await super.messageHandler(event)) return true;

            const request: Request<MessageTypes.Message> = {
                ...event.data,
                connect: () => this.connect(),
                onNetworkDisconnect: () => {
                    if (this.api) {
                        // Broadcast that we are being disconnected
                        this.post({
                            id: -1,
                            type: RESPONSES.DISCONNECTED,
                            payload: true,
                        });
                    }
                    this.disconnect();
                },
                post: (data: Response) => this.post(data),
                state: this.state,
                getTokenMetadata: this.lazyTokens.getOrInit,
            };

            const response = await onRequest(request, this.isTestnet);
            this.post({ id: event.data.id, ...response });
        } catch (error) {
            this.errorResponse(event.data.id, error);
        }
    }

    disconnect(): void {
        if (!this.api) {
            return;
        }

        this.state.getAccounts().forEach(a => {
            if (a.subscriptionId != null) {
                abortSubscription(a.subscriptionId);
            }
        });

        if (this.state.getSubscription('block')) {
            const interval = this.state.getSubscription('block') as IntervalId;
            clearInterval(interval);
            this.state.removeSubscription('block');
        }

        this.api = undefined;
    }
}

// export worker factory used in src/index
export default function Solana() {
    return new SolanaWorker();
}

if (CONTEXT === 'worker') {
    // Initialize module if script is running in worker context
    const module = new SolanaWorker();
    onmessage = module.messageHandler.bind(module);
}
