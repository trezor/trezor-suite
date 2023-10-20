import type { Response, AccountInfo } from '@trezor/blockchain-link-types';
import type * as MessageTypes from '@trezor/blockchain-link-types/lib/messages';
import { CustomError } from '@trezor/blockchain-link-types/lib/constants/errors';
import { BaseWorker, ContextType, CONTEXT } from '../baseWorker';
import { MESSAGES, RESPONSES } from '@trezor/blockchain-link-types/lib/constants';
import { Connection, PublicKey } from '@solana/web3.js';

export type SolanaAPI = Connection;

type Context = ContextType<SolanaAPI>;
type Request<T> = T & Context;

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

    const account: AccountInfo = {
        descriptor: payload.descriptor,
        balance: accountInfo.lamports.toString(), // TODO(vl): check if this should also include staking balances
        availableBalance: accountInfo.lamports.toString(), // TODO(vl): revisit to make sure that what getAccountInfo returns is actually available balance
        empty: accountInfo.lamports === 0, // TODO(vl): this is not correct, it should depend on the length of transaction history
        // TODO(vl): transaction history
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
};

const getInfo = async (request: Request<MessageTypes.GetInfo>) => {
    const api = await request.connect();
    const blockHeight = await api.getBlockHeight('finalized');

    // more info for the parsedBlock endpoint here https://www.quicknode.com/docs/solana/getParsedBlock
    // the maxSupportedTransactionVersion might need to get updated if solana introduces a new version of transactions
    const { blockhash: blockHash } = await api.getParsedBlock(blockHeight, {
        maxSupportedTransactionVersion: 0,
    });
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

const subscribeBlock = async ({ state, connect, post }: Context) => {
    if (state.getSubscription('block')) return;
    const api = await connect();

    // the solana RPC api has subscribe method, see here: https://www.quicknode.com/docs/solana/rootSubscribe
    // but solana block height is updated so often that it slows down the whole application and overloads the the api
    // so we instead use setInterval to check for new blocks every 10 seconds
    const interval = setInterval(async () => {
        const blockHeight = await api.getBlockHeight('finalized');
        const { blockhash: blockHash } = await api.getParsedBlock(blockHeight, {
            maxSupportedTransactionVersion: 0,
        });

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
    }, 10000);
    // we save the interval in the state so we can clear it later
    state.addSubscription('block', interval);
};

const unsubscribeBlock = ({ state }: Context) => {
    if (!state.getSubscription('block')) return;
    const interval = state.getSubscription('block') as NodeJS.Timer;
    clearInterval(interval);
    state.removeSubscription('block');
};

const subscribe = (request: Request<MessageTypes.Subscribe>) => {
    switch (request.payload.type) {
        case 'block':
            subscribeBlock(request);
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
