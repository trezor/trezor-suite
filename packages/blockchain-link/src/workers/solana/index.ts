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
} from '@trezor/blockchain-link-types/lib/solana';
import type * as MessageTypes from '@trezor/blockchain-link-types/lib/messages';
import { CustomError } from '@trezor/blockchain-link-types/lib/constants/errors';
import { BaseWorker, ContextType, CONTEXT } from '../baseWorker';
import { MESSAGES, RESPONSES } from '@trezor/blockchain-link-types/lib/constants';
import { Connection, Message, PublicKey } from '@solana/web3.js';
import { solanaUtils } from '@trezor/blockchain-link-utils';

import {
    transformTokenInfo,
    TOKEN_PROGRAM_PUBLIC_KEY,
} from '@trezor/blockchain-link-utils/lib/solana';
import { TOKEN_ACCOUNT_LAYOUT } from './tokenUtils';

export type SolanaAPI = Connection;

type Context = ContextType<SolanaAPI>;
type Request<T> = T & Context;

type SignatureWithSlot = {
    signature: string;
    slot: number;
};

const getAllSignatures = async (
    api: SolanaAPI,
    descriptor: MessageTypes.GetAccountInfo['payload']['descriptor'],
) => {
    let lastSignature: SignatureWithSlot | undefined;
    let keepFetching = true;
    let allSignatures: SignatureWithSlot[] = [];

    const limit = 100;
    while (keepFetching) {
        const signaturesInfos = // eslint-disable-next-line no-await-in-loop
            await api.getSignaturesForAddress(new PublicKey(descriptor), {
                before: lastSignature?.signature,
                limit,
            });

        const signatures = signaturesInfos.map(info => ({
            signature: info.signature,
            slot: info.slot,
        }));
        lastSignature = signatures[signatures.length - 1];
        keepFetching = signatures.length === limit;
        allSignatures = [...allSignatures, ...signatures];
    }
    return allSignatures;
};

const fetchTransactionPage = async (
    api: SolanaAPI,
    signatures: string[],
): Promise<ParsedTransactionWithMeta[]> => {
    // avoid requests that are too big by querying max N signatures at once
    const perChunk = 50; // items per chunk
    const confirmedSignatureChunks = signatures.reduce((resultArray, item, index) => {
        const chunkIndex = Math.floor(index / perChunk);
        if (!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = []; // start a new chunk
        }
        resultArray[chunkIndex].push(item);
        return resultArray;
    }, [] as string[][]);

    const confirmedTxsChunks = await Promise.all(
        confirmedSignatureChunks.map(signatureChunk =>
            api.getParsedTransactions(signatureChunk, {
                maxSupportedTransactionVersion: 0,
                commitment: 'confirmed',
            }),
        ),
    );

    return confirmedTxsChunks.flat().filter((tx): tx is ParsedTransactionWithMeta => !!tx);
};

const isValidTransaction = (tx: ParsedTransactionWithMeta): tx is SolanaValidParsedTxWithMeta =>
    !!(tx && tx.meta && tx.transaction && tx.blockTime);

const pushTransaction = async (request: Request<MessageTypes.PushTransaction>) => {
    const rawTx = request.payload.startsWith('0x') ? request.payload.slice(2) : request.payload;
    const api = await request.connect();
    const payload = await api.sendRawTransaction(Buffer.from(rawTx, 'hex'));
    return {
        type: RESPONSES.PUSH_TRANSACTION,
        payload,
    } as const;
};

const getAccountInfo = async (request: Request<MessageTypes.GetAccountInfo>) => {
    const { payload } = request;
    const { details = 'basic' } = payload;
    const api = await request.connect();

    const publicKey = new PublicKey(payload.descriptor);

    const accountInfo = await api.getAccountInfo(publicKey);

    const getTransactionPage = async (
        txIds: string[],
        tokenAccountsInfos: SolanaTokenAccountInfo[],
    ) => {
        const transactionsPage = await fetchTransactionPage(api, txIds);

        return (
            await Promise.all(
                transactionsPage
                    .filter(isValidTransaction)
                    .map(tx =>
                        solanaUtils.transformTransaction(
                            tx,
                            payload.descriptor,
                            tokenAccountsInfos,
                        ),
                    ),
            )
        ).filter((tx): tx is Transaction => !!tx);
    };

    const tokenAccounts = await api.getParsedTokenAccountsByOwner(publicKey, {
        programId: new PublicKey(TOKEN_PROGRAM_PUBLIC_KEY),
    });

    const allAccounts = [payload.descriptor, ...tokenAccounts.value.map(a => a.pubkey.toString())];

    const allTxIds = Array.from(
        new Set(
            (await Promise.all(allAccounts.map(account => getAllSignatures(api, account))))
                .flat()
                .sort((a, b) => b.slot - a.slot)
                .map(it => it.signature),
        ),
    );

    const pageNumber = payload.page ? payload.page - 1 : 0;
    // for the first page of txs, payload.page is undefined, for the second page is 2
    const pageSize = payload.pageSize || 5;

    const pageStartIndex = pageNumber * pageSize;
    const pageEndIndex = Math.min(pageStartIndex + pageSize, allTxIds.length);

    const txIdPage = allTxIds.slice(pageStartIndex, pageEndIndex);

    const tokenAccountsInfos = tokenAccounts.value.map(a => ({
        address: a.pubkey.toString(),
        mint: a.account.data.parsed?.info?.mint as string | undefined,
        decimals: a.account.data.parsed?.info?.tokenAmount?.decimals as number | undefined,
    }));

    const transactionPage =
        details === 'txs' ? await getTransactionPage(txIdPage, tokenAccountsInfos) : undefined;

    // Fetch token info only if the account owns tokens
    let tokens: TokenInfo[] = [];
    if (tokenAccounts.value.length > 0) {
        const tokenMetadata = await solanaUtils.getTokenMetadata();

        tokens = transformTokenInfo(tokenAccounts.value, tokenMetadata);
    }

    const balance = await api.getBalance(publicKey);

    const account: AccountInfo = {
        descriptor: payload.descriptor,
        balance: balance.toString(),
        availableBalance: balance.toString(),
        empty: !allTxIds.length,
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
        ...(accountInfo != null
            ? {
                  misc: {
                      owner: accountInfo.owner.toString(),
                  },
              }
            : {}),
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

const getInfo = async (request: Request<MessageTypes.GetInfo>) => {
    const api = await request.connect();
    const { blockhash: blockHash, lastValidBlockHeight: blockHeight } =
        await api.getLatestBlockhash('finalized');
    const isTestnet =
        (await api.getGenesisHash()) !== '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d';
    const serverInfo = {
        // genesisHash is reliable identifier of the network, for mainnet the genesis hash is 5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d
        testnet: isTestnet,
        blockHeight,
        blockHash,
        shortcut: isTestnet ? 'dsol' : 'sol',
        url: api.rpcEndpoint,
        name: 'Solana',
        version: (await api.getVersion())['solana-core'],
        decimals: 9,
    };
    return {
        type: RESPONSES.GET_INFO,
        payload: { ...serverInfo },
    } as const;
};

const estimateFee = async (request: Request<MessageTypes.EstimateFee>) => {
    const api = await request.connect();

    const message = request.payload.specific?.data;
    const isCreatingAccount = request.payload.specific?.isCreatingAccount;

    if (message == null) {
        throw new Error('Could not estimate fee for transaction.');
    }

    const result = await api.getFeeForMessage(Message.from(Buffer.from(message, 'hex')));

    // The result can be null, for example if the transaction blockhash is invalid.
    // In this case, we should fall back to the default fee.
    if (result.value == null) {
        throw new Error('Could not estimate fee for transaction.');
    }

    const accountCreationFee = isCreatingAccount
        ? await api.getMinimumBalanceForRentExemption(TOKEN_ACCOUNT_LAYOUT.span)
        : 0;

    const payload = [
        {
            feePerUnit: `${result.value + accountCreationFee}`,
        },
    ];

    return {
        type: RESPONSES.ESTIMATE_FEE,
        payload,
    } as const;
};

const BLOCK_SUBSCRIBE_INTERVAL_MS = 10000;
const subscribeBlock = async ({ state, connect, post }: Context) => {
    if (state.getSubscription('block')) return { subscribed: true };
    const api = await connect();

    // the solana RPC api has subscribe method, see here: https://www.quicknode.com/docs/solana/rootSubscribe
    // but solana block height is updated so often that it slows down the whole application and overloads the the api
    // so we instead use setInterval to check for new blocks every `BLOCK_SUBSCRIBE_INTERVAL_MS`
    const interval = setInterval(async () => {
        const { blockhash: blockHash, lastValidBlockHeight: blockHeight } =
            await api.getLatestBlockhash('finalized');
        if (blockHeight) {
            post({
                id: -1,
                type: RESPONSES.NOTIFICATION,
                payload: {
                    type: 'block',
                    payload: {
                        blockHeight,
                        blockHash,
                    },
                },
            });
        }
    }, BLOCK_SUBSCRIBE_INTERVAL_MS);
    // we save the interval in the state so we can clear it later
    state.addSubscription('block', interval);

    return { subscribed: true };
};

const unsubscribeBlock = ({ state }: Context) => {
    if (!state.getSubscription('block')) return;
    const interval = state.getSubscription('block') as NodeJS.Timer;
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
                            descriptor: tokenAccount.publicKey.toString(),
                        })) || [],
                ) || []
            ).flat(),
        )
        .flat();

const findTokenAccountOwner = (
    accounts: SubscriptionAccountInfo[],
    accountDescriptor: string,
): SubscriptionAccountInfo | undefined =>
    accounts.find(
        account =>
            account.tokens?.find(
                token =>
                    token.accounts?.find(
                        tokenAccount => tokenAccount.publicKey.toString() === accountDescriptor,
                    ),
            ),
    );

const subscribeAccounts = async (
    { connect, state, post }: Context,
    accounts: SubscriptionAccountInfo[],
) => {
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
    newAccounts.forEach(a => {
        const subscriptionId = api.onAccountChange(new PublicKey(a.descriptor), async () => {
            // get the last transaction signature for the account, since that wha triggered this callback
            const lastSignature = (
                await api.getSignaturesForAddress(new PublicKey(a.descriptor), {
                    before: undefined,
                    limit: 1,
                })
            )[0]?.signature;
            if (!lastSignature) return;

            // get the last transaction
            const lastTx = (
                await api.getParsedTransactions([lastSignature], {
                    maxSupportedTransactionVersion: 0,
                    commitment: 'finalized',
                })
            )[0];

            if (!lastTx || !isValidTransaction(lastTx)) {
                return;
            }

            const tx = await solanaUtils.transformTransaction(lastTx, a.descriptor, []);

            // For token accounts we need to emit an event with the owner account's descriptor
            // since we don't store token accounts in the user's accounts.
            const descriptor =
                findTokenAccountOwner(state.getAccounts(), a.descriptor)?.descriptor ||
                a.descriptor;

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
        });
        state.addAccounts([{ ...a, subscriptionId }]);
    });
    return { subscribed: newAccounts.length > 0 };
};

const unsubscribeAccounts = async (
    { state, connect }: Context,
    accounts: SubscriptionAccountInfo[] | undefined = [],
) => {
    const api = await connect();

    const subscribedAccounts = state.getAccounts();

    accounts.forEach(a => {
        if (a.subscriptionId) {
            api.removeAccountChangeListener(a.subscriptionId);
            state.removeAccounts([a]);
        }

        // unsubscribe token accounts as well
        a.tokens?.forEach(t => {
            t.accounts?.forEach(ta => {
                const tokenAccount = subscribedAccounts.find(
                    sa => sa.descriptor === ta.publicKey.toString(),
                );
                if (tokenAccount?.subscriptionId) {
                    api.removeAccountChangeListener(tokenAccount.subscriptionId);
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

const onRequest = (request: Request<MessageTypes.Message>) => {
    switch (request.type) {
        case MESSAGES.GET_ACCOUNT_INFO:
            return getAccountInfo(request);
        case MESSAGES.GET_INFO:
            return getInfo(request);
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

    tryConnect(url: string): Promise<SolanaAPI> {
        const api = new Connection(url, { wsEndpoint: url.replace('https', 'wss') });
        this.post({ id: -1, type: RESPONSES.CONNECTED });
        return Promise.resolve(api);
    }

    async messageHandler(event: { data: MessageTypes.Message }) {
        try {
            // skip processed messages
            if (await super.messageHandler(event)) return true;

            const request: Request<MessageTypes.Message> = {
                ...event.data,
                connect: () => this.connect(),
                post: (data: Response) => this.post(data),
                state: this.state,
            };

            const response = await onRequest(request);
            this.post({ id: event.data.id, ...response });
        } catch (error) {
            this.errorResponse(event.data.id, error);
        }
    }

    disconnect(): void {
        if (!this.api) {
            return;
        }

        this.state
            .getAccounts()
            .forEach(
                a => a.subscriptionId && this.api?.removeAccountChangeListener(a.subscriptionId),
            );

        if (this.state.getSubscription('block')) {
            const interval = this.state.getSubscription('block') as NodeJS.Timer;
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
