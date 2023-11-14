import type {
    Response,
    SubscriptionAccountInfo,
} from '@trezor/blockchain-link-types';
import type * as MessageTypes from '@trezor/blockchain-link-types/lib/messages';
import { BaseWorker, ContextType, CONTEXT } from '../baseWorker';
import { MESSAGES, RESPONSES } from '@trezor/blockchain-link-types/lib/constants';
import { Connection, PublicKey } from '@solana/web3.js';

export type SolanaAPI = Connection;

type Context = ContextType<SolanaAPI>;
type Request<T> = T & Context;

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

            if (!lastTx || !isValidTransaction(lastTx)) {
                return;
            }

            const tx = solanaUtils.transformTransaction(
                lastTx,
                a.descriptor,
                slotToBlockHeightMapping,
            );
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
        case MESSAGES.GET_INFO:
            return getInfo(request);
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
