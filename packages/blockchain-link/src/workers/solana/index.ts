import type { Response, AccountInfo, SubscriptionAccountInfo } from '@trezor/blockchain-link-types';
import type * as MessageTypes from '@trezor/blockchain-link-types/lib/messages';
import { CustomError } from '@trezor/blockchain-link-types/lib/constants/errors';
import { BaseWorker, ContextType, CONTEXT } from '../baseWorker';
import { MESSAGES, RESPONSES } from '@trezor/blockchain-link-types/lib/constants';
import { Connection, Message, ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';
import { Transaction } from '../..';
import { solanaUtils } from '@trezor/blockchain-link-utils';

export type SolanaAPI = Connection;

type Context = ContextType<SolanaAPI>;
type Request<T> = T & Context;

const getAllSignatures = async (
    api: SolanaAPI,
    descriptor: MessageTypes.GetAccountInfo['payload']['descriptor'],
) => {
    let lastSignature: string | undefined;
    let keepFetching = true;
    let allSignatures: string[] = [];

    const limit = 100;
    while (keepFetching) {
        const signaturesInfos = // eslint-disable-next-line no-await-in-loop
            await api.getSignaturesForAddress(new PublicKey(descriptor), {
                before: lastSignature,
                limit,
            });

        const signatures = signaturesInfos.map(info => info.signature);
        lastSignature = signatures[signatures.length - 1];
        keepFetching = signatures.length === limit;
        allSignatures = [...allSignatures, ...signatures];
    }
    return allSignatures;
};

const pushTransaction = async (request: Request<MessageTypes.PushTransaction>) => {
    const rawTx = request.payload.startsWith('0x') ? request.payload.slice(2) : request.payload;
    const api = await request.connect();
    const payload = await api.sendRawTransaction(Buffer.from(rawTx, 'hex'));
    return {
        type: RESPONSES.PUSH_TRANSACTION,
        payload,
    } as const;
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

const getAccountInfo = async (request: Request<MessageTypes.GetAccountInfo>) => {
    const { payload } = request;
    const api = await request.connect();

    const accountInfo = await api.getAccountInfo(new PublicKey(payload.descriptor));

    if (!accountInfo) {
        // return empty account
        const account: AccountInfo = {
            descriptor: payload.descriptor,
            balance: '0', // default balance
            availableBalance: '0', // default balance
            empty: true,
            history: {
                total: -1,
                unconfirmed: 0,
                transactions: undefined,
            },
        };
        return Promise.resolve({
            type: RESPONSES.GET_ACCOUNT_INFO,
            payload: account,
        } as const);
    }

    // for the first page of txs, payload.page is undefined, for the second page is 2
    const page = payload.page ? payload.page - 1 : 0;
    const pageSize = payload.pageSize || 10; // TODO(vl): change to 25

    const allSignatures = Array.from(new Set(await getAllSignatures(api, payload.descriptor)));
    const pageStartIndex = page * pageSize;
    const pageEndIndex = Math.min(pageStartIndex + pageSize, allSignatures.length);

    const transactionsPage = await fetchTransactionPage(
        api,
        allSignatures.slice(pageStartIndex, pageEndIndex),
    );

    const uniqueTransactionSlots = Array.from(new Set(transactionsPage.map(tx => tx.slot)));

    const slotToBlockHeightMapping = (
        await Promise.all(
            uniqueTransactionSlots.map(async slot => {
                const { blockHeight } = await api.getParsedBlock(slot, {
                    maxSupportedTransactionVersion: 0,
                });
                return blockHeight;
            }),
        )
    ).reduce(
        (acc, curr, i) => ({ ...acc, [uniqueTransactionSlots[i]]: curr }),
        {} as Record<number, number | null>,
    );

    const transactions = transactionsPage
        .map(tx =>
            solanaUtils.transformTransaction(tx, payload.descriptor, slotToBlockHeightMapping),
        )
        .filter((tx): tx is Transaction => !!tx);

    const account: AccountInfo = {
        descriptor: payload.descriptor,
        balance: accountInfo.lamports.toString(), // TODO(vl): check if this should also include staking balances
        availableBalance: accountInfo.lamports.toString(), // TODO(vl): revisit to make sure that what getAccountInfo returns is actually available balance
        empty: !!transactions.length,
        history: {
            total: allSignatures.length,
            unconfirmed: 0,
            transactions,
            txids: transactions.map(({ txid }) => txid),
        },
        page: {
            total: allSignatures.length,
            index: page,
            size: transactions.length,
        },
    };

    return Promise.resolve({
        type: RESPONSES.GET_ACCOUNT_INFO,
        payload: account,
    } as const);
};

const getInfo = async (request: Request<MessageTypes.GetInfo>) => {
    const api = await request.connect();
    const { blockhash: blockHash, lastValidBlockHeight: blockHeight } =
        await api.getLatestBlockhash('finalized');
    const serverInfo = {
        // genesisHash is reliable identifier of the network, for mainnet the genesis hash is 5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d
        testnet: (await api.getGenesisHash()) !== '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',
        blockHeight,
        blockHash,
        shortcut: 'sol',
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

    if (message == null) {
        throw new Error('Could not estimate fee for transaction.');
    }

    const result = await api.getFeeForMessage(Message.from(Buffer.from(message)));

    // The result can be null, for example if the transaction blockhash is invalid.
    // In this case, we should fall back to the default fee.
    if (result.value == null) {
        throw new Error('Could not estimate fee for transaction.');
    }

    const payload = [
        {
            feePerUnit: `${result.value}`,
        },
    ];

    return {
        type: RESPONSES.ESTIMATE_FEE,
        payload,
    } as const;
};

const BLOCK_SUBSCRIBE_INTERVAL_MS = 10000;
const subscribeBlock = async ({ state, connect, post }: Context) => {
    if (state.getSubscription('block')) return;
    const api = await connect();

    // the solana RPC api has subscribe method, see here: https://www.quicknode.com/docs/solana/rootSubscribe
    // but solana block height is updated so often that it slows down the whole application and overloads the the api
    // so we instead use setInterval to check for new blocks every 10 seconds
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
};

const unsubscribeBlock = ({ state }: Context) => {
    if (!state.getSubscription('block')) return;
    const interval = state.getSubscription('block') as NodeJS.Timer;
    clearInterval(interval);
    state.removeSubscription('block');
};

const subscribeAccounts = async (
    { connect, state, post }: Context,
    accounts: SubscriptionAccountInfo[],
) => {
    const api = await connect();
    const subscribedAccounts = state.getAccounts();
    const newAccounts = accounts.filter(
        account =>
            !subscribedAccounts.some(
                subscribeAccount => account.descriptor === subscribeAccount.descriptor,
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
            if (!lastTx) return;

            const slotToBlockHeightMapping = {
                [lastTx.slot]: (
                    await api.getParsedBlock(lastTx.slot, {
                        maxSupportedTransactionVersion: 0,
                    })
                ).blockHeight,
            };

            const tx = solanaUtils.transformTransaction(
                lastTx,
                a.descriptor,
                slotToBlockHeightMapping,
            );

            if (!tx) return;
            post({
                id: -1,
                type: RESPONSES.NOTIFICATION,
                payload: {
                    type: 'notification',
                    payload: {
                        descriptor: a.descriptor,
                        tx,
                    },
                },
            });
            state.addAccounts([{ ...a, subscriptionId }]);
        });
    });
    return { subscribed: true };
};

const unsubscribeAccounts = async (
    { state, connect }: Context,
    accounts: SubscriptionAccountInfo[] | undefined = [],
) => {
    const api = await connect();
    accounts.forEach(a => {
        if (a.subscriptionId) {
            api.removeAccountChangeListener(a.subscriptionId);
            state.removeAccounts([a]);
        }
    });
};

const subscribe = (request: Request<MessageTypes.Subscribe>) => {
    switch (request.payload.type) {
        case 'block':
            subscribeBlock(request);
            break;
        case 'accounts':
            subscribeAccounts(request, request.payload.accounts);
            break;
        default:
            throw new CustomError('worker_unknown_request', `+${request.type}`);
    }
    return {
        type: RESPONSES.SUBSCRIBE,
        payload: { subscribed: true },
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
        type: RESPONSES.SUBSCRIBE,
        payload: { subscribed: false },
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
        const api = new Connection(`https://${url}`, { wsEndpoint: `wss://${url}` });
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
        if (this.api) {
            // TODO(vl): revisit, seems there is no way to disconnect, but we can remove all created listeners
        }
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
