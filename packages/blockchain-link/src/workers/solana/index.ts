import type {
    Response,
    AccountInfo,
    SubscriptionAccountInfo,
    TokenInfo,
} from '@trezor/blockchain-link-types';
import type * as MessageTypes from '@trezor/blockchain-link-types/lib/messages';
import { CustomError } from '@trezor/blockchain-link-types/lib/constants/errors';
import { BaseWorker, ContextType, CONTEXT } from '../baseWorker';
import { MESSAGES, RESPONSES } from '@trezor/blockchain-link-types/lib/constants';
import { Connection, Message, PublicKey } from '@solana/web3.js';
import {
    transformTokenInfo,
    TOKEN_PROGRAM_PUBLIC_KEY,
} from '@trezor/blockchain-link-utils/lib/solana';
import { getTokenMetadata, TOKEN_ACCOUNT_LAYOUT } from './tokenUtils';

export type SolanaAPI = Connection;

type Context = ContextType<SolanaAPI>;
type Request<T> = T & Context;
const getAccountInfo = async (request: Request<MessageTypes.GetAccountInfo>) => {
    const { payload } = request;
    const { details = 'basic' } = payload;
    const api = await request.connect();

    const publicKey = new PublicKey(payload.descriptor);

    const accountInfo = await api.getAccountInfo(publicKey);

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

    const tokenAccounts = await api.getParsedTokenAccountsByOwner(publicKey, {
        programId: new PublicKey(TOKEN_PROGRAM_PUBLIC_KEY),
    });

    // Fetch token info only if the account owns tokens
    let tokens: TokenInfo[] = [];
    if (tokenAccounts.value.length > 0) {
        const tokenMetadata = await getTokenMetadata();

        tokens = transformTokenInfo(tokenAccounts.value, tokenMetadata);
    }

    const account: AccountInfo = {
        descriptor: payload.descriptor,
        balance: accountInfo.lamports.toString(),
        availableBalance: accountInfo.lamports.toString(),
        tokens,
        misc: {
            owner: accountInfo.owner.toString(),
        },
    };
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
        case MESSAGES.GET_ACCOUNT_INFO:
            return getAccountInfo(request);
        case MESSAGES.GET_INFO:
            return getInfo(request);
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
