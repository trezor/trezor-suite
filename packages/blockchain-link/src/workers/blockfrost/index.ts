import { CustomError } from '../../constants/errors';
import { MESSAGES, RESPONSES } from '../../constants';
import * as MessageTypes from '../../types/messages';
import Connection from './websocket';
import { SubscriptionAccountInfo } from '../../types/common';
import { Response, Message } from '../../types';
import WorkerCommon from '../common';
import { BlockfrostTransaction, BlockContent } from '../../types/blockfrost';
import { transformUtxos, transformAccountInfo, transformTransaction } from './utils';

declare function postMessage(data: Response): void;

const common = new WorkerCommon(postMessage);

let api: Connection | undefined;
let endpoints: string[] = [];

const cleanup = () => {
    if (api) {
        api.dispose();
        api.removeAllListeners();
        api = undefined;
    }
    endpoints = [];
    common.removeAccounts(common.getAccounts());
    common.removeAddresses(common.getAddresses());
    common.clearSubscriptions();
};
const connect = async (): Promise<Connection> => {
    if (api && api.isConnected()) return api;

    // validate endpoints
    const { server, timeout, pingTimeout, keepAlive } = common.getSettings();
    if (!server || !Array.isArray(server) || server.length < 1) {
        throw new CustomError('connect', 'Endpoint not set');
    }

    if (endpoints.length < 1) {
        endpoints = common.shuffleEndpoints(server.slice(0));
    }

    common.debug('Connecting to', endpoints[0]);
    const connection = new Connection({
        url: endpoints[0],
        timeout,
        pingTimeout,
        keepAlive,
    });

    try {
        await connection.connect();
        api = connection;
    } catch (error) {
        common.debug('Websocket connection failed');
        api = undefined;
        // connection error. remove endpoint
        endpoints.splice(0, 1);
        // and try another one or throw error
        if (endpoints.length < 1) {
            throw new CustomError('connect', 'All backends are down');
        }
        return connect();
    }

    connection.on('disconnected', () => {
        common.response({ id: -1, type: RESPONSES.DISCONNECTED, payload: true });
        cleanup();
    });

    common.response({
        id: -1,
        type: RESPONSES.CONNECTED,
    });

    common.debug('Connected');
    return connection;
};

const getInfo = async (data: { id: number } & MessageTypes.GetInfo): Promise<void> => {
    try {
        const socket = await connect();
        const info = await socket.getServerInfo();
        common.response({
            id: data.id,
            type: RESPONSES.GET_INFO,
            payload: {
                url: socket.options.url,
                ...info,
            },
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

const getBlockHash = async (data: { id: number } & MessageTypes.GetBlockHash): Promise<void> => {
    try {
        const socket = await connect();
        const blockMessage = await socket.getBlockHash(data.payload);
        common.response({
            id: data.id,
            type: RESPONSES.GET_BLOCK_HASH,
            payload: blockMessage.hash,
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

const getTransaction = async (
    data: { id: number } & MessageTypes.GetTransaction
): Promise<void> => {
    const { payload } = data;
    try {
        const socket = await connect();
        const tx = await socket.getTransaction(payload);
        common.response({
            id: data.id,
            type: RESPONSES.GET_TRANSACTION,
            payload: {
                type: 'blockfrost',
                tx,
            },
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

const estimateFee = async (data: { id: number } & MessageTypes.EstimateFee): Promise<void> => {
    try {
        const socket = await connect();
        const resp = await socket.estimateFee(data.payload);
        const feeOptions: { feePerUnit: string }[] = [];

        feeOptions.push({ feePerUnit: resp.lovelacePerByte.toString() });

        common.response({
            id: data.id,
            type: RESPONSES.ESTIMATE_FEE,
            payload: feeOptions,
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

const pushTransaction = async (
    data: { id: number } & MessageTypes.PushTransaction
): Promise<void> => {
    try {
        const socket = await connect();

        const resp = await socket.pushTransaction(data.payload);
        common.response({
            id: data.id,
            type: RESPONSES.PUSH_TRANSACTION,
            payload: resp.result,
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

const getAccountInfo = async (
    data: { id: number } & MessageTypes.GetAccountInfo
): Promise<void> => {
    const { payload } = data;
    try {
        const socket = await connect();
        const info = await socket.getAccountInfo(payload);
        common.response({
            id: data.id,
            type: RESPONSES.GET_ACCOUNT_INFO,
            payload: transformAccountInfo(info),
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

const getAccountUtxo = async (
    data: { id: number } & MessageTypes.GetAccountUtxo
): Promise<void> => {
    const { payload } = data;
    try {
        const socket = await connect();
        const utxos = await socket.getAccountUtxo(payload);

        common.response({
            id: data.id,
            type: RESPONSES.GET_ACCOUNT_UTXO,
            payload: transformUtxos(utxos),
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

const onNewBlock = (event: BlockContent) => {
    common.response({
        id: -1,
        type: RESPONSES.NOTIFICATION,
        payload: {
            type: 'block',
            payload: {
                blockHeight: event.height || 0,
                blockHash: event.hash,
            },
        },
    });
};

const onTransaction = (event: BlockfrostTransaction) => {
    const descriptor = event.address;
    const account = common.getAccount(descriptor);

    common.response({
        id: -1,
        type: RESPONSES.NOTIFICATION,
        payload: {
            type: 'notification',
            payload: {
                descriptor: account ? account.descriptor : descriptor,
                tx: account
                    ? transformTransaction(account.descriptor, account.addresses, event)
                    : transformTransaction(descriptor, undefined, event),
            },
        },
    });
};

const subscribeBlock = async () => {
    if (common.getSubscription('block')) return { subscribed: true };
    const socket = await connect();
    common.addSubscription('block');
    socket.on('block', onNewBlock);
    return socket.subscribeBlock();
};

const subscribeAccounts = async (accounts: SubscriptionAccountInfo[]) => {
    common.addAccounts(accounts);
    const socket = await connect();
    if (!common.getSubscription('notification')) {
        socket.on('notification', onTransaction);
        common.addSubscription('notification');
    }

    return socket.subscribeAddresses(common.getAddresses());
};

const subscribeAddresses = async (addresses: string[]) => {
    common.addAddresses(addresses);
    const socket = await connect();
    if (!common.getSubscription('notification')) {
        socket.on('notification', onTransaction);
        common.addSubscription('notification');
    }

    return socket.subscribeAddresses(common.getAddresses());
};

const subscribe = async (data: { id: number } & MessageTypes.Subscribe): Promise<void> => {
    const { payload } = data;

    try {
        let response;
        if (payload.type === 'accounts') {
            response = await subscribeAccounts(payload.accounts);
        } else if (payload.type === 'addresses') {
            response = await subscribeAddresses(payload.addresses);
        } else if (payload.type === 'block') {
            response = await subscribeBlock();
        } else {
            throw new CustomError('invalid_param', '+type');
        }

        common.response({
            id: data.id,
            type: RESPONSES.SUBSCRIBE,
            payload: response,
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

const unsubscribeBlock = async () => {
    if (!common.getSubscription('block')) return { subscribed: false };
    const socket = await connect();
    socket.removeListener('block', onNewBlock);
    common.removeSubscription('block');
    return socket.unsubscribeBlock();
};

const unsubscribeAccounts = async (accounts?: SubscriptionAccountInfo[]) => {
    common.removeAccounts(accounts || common.getAccounts());

    const socket = await connect();
    const subscribed = common.getAddresses();
    if (subscribed.length < 1) {
        // there are no subscribed addresses left
        // remove listeners
        socket.removeListener('notification', onTransaction);
        common.removeSubscription('notification');
        return socket.unsubscribeAddresses();
    }
    // subscribe remained addresses
    return socket.subscribeAddresses(subscribed);
};

const unsubscribeAddresses = async (addresses?: string[]) => {
    const socket = await connect();
    // remove accounts
    if (!addresses) {
        common.removeAccounts(common.getAccounts());
    }
    const subscribed = common.removeAddresses(addresses || common.getAddresses());
    if (subscribed.length < 1) {
        // there are no subscribed addresses left
        // remove listeners
        socket.removeListener('notification', onTransaction);
        common.removeSubscription('notification');
        return socket.unsubscribeAddresses();
    }
    // subscribe remained addresses
    return socket.subscribeAddresses(subscribed);
};

const unsubscribe = async (data: { id: number } & MessageTypes.Unsubscribe): Promise<void> => {
    const { payload } = data;
    try {
        let response;
        if (payload.type === 'accounts') {
            response = await unsubscribeAccounts(payload.accounts);
        } else if (payload.type === 'addresses') {
            response = await unsubscribeAddresses(payload.addresses);
        } else if (payload.type === 'block') {
            response = await unsubscribeBlock();
        } else {
            throw new CustomError('invalid_param', '+type');
        }

        common.response({
            id: data.id,
            type: RESPONSES.UNSUBSCRIBE,
            payload: response,
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

const disconnect = async (data: { id: number }) => {
    if (!api) {
        common.response({ id: data.id, type: RESPONSES.DISCONNECTED, payload: true });
        return;
    }
    try {
        await api.disconnect();
        common.response({ id: data.id, type: RESPONSES.DISCONNECTED, payload: true });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

onmessage = (event: { data: Message }) => {
    if (!event.data) return;
    const { data } = event;
    const { id, type } = data;

    common.debug('onmessage', data);

    switch (data.type) {
        case MESSAGES.HANDSHAKE:
            common.setSettings(data.settings);
            break;
        case MESSAGES.CONNECT:
            connect()
                .then(() => {
                    common.response({ id, type: RESPONSES.CONNECT, payload: true });
                })
                .catch(error => common.errorHandler({ id, error }));
            break;
        case MESSAGES.GET_INFO:
            getInfo(data);
            break;
        case MESSAGES.GET_ACCOUNT_UTXO:
            getAccountUtxo(data);
            break;
        case MESSAGES.PUSH_TRANSACTION:
            pushTransaction(data);
            break;
        case MESSAGES.GET_BLOCK_HASH:
            getBlockHash(data);
            break;
        case MESSAGES.GET_TRANSACTION:
            getTransaction(data);
            break;
        case MESSAGES.ESTIMATE_FEE:
            estimateFee(data);
            break;
        case MESSAGES.GET_ACCOUNT_INFO:
            getAccountInfo(data);
            break;
        case MESSAGES.SUBSCRIBE:
            subscribe(data);
            break;
        case MESSAGES.UNSUBSCRIBE:
            unsubscribe(data);
            break;
        case MESSAGES.DISCONNECT:
            disconnect(data);
            break;
        // @ts-ignore this message is used in tests
        case 'terminate':
            cleanup();
            break;
        default:
            common.errorHandler({
                id,
                error: new CustomError('worker_unknown_request', `+${type}`),
            });
            break;
    }
};

// Handshake to host
common.handshake();
