import { CustomError } from '../../constants/errors';
import { MESSAGES, RESPONSES } from '../../constants';
import Connection from './websocket';
import { RpcClient, LoginData } from './rpcclient';
import * as utils from './utils';

import { Message, Response, SubscriptionAccountInfo } from '../../types';
import { AddressNotification, BlockNotification, Transaction } from '../../types/rpcbitcoind';
import * as MessageTypes from '../../types/messages';
import WorkerCommon from '../common';

declare function postMessage(data: Response): void;

const common = new WorkerCommon(postMessage);

let api: Connection | undefined;
let endpoints: string[] = [];

const blockSubscrData: BlockNotification[] = [];
let subscrBlockIntervalLink;
let subscrAddressIntervalLink;

// This data must be obtained from somewhere in the front end
const loginData: LoginData = {
    username: 'rpc',
    password: 'rpcdsfcxvxctrnfnvkkqkjvjtjnbnnkbvibnifnbkdfbdfkbndfkbnfdbfdnkeckvncxq1',
    host: '78.47.39.234',
    port: '8332',
};

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
        const rpcClientObj = new RpcClient(loginData);
        const blockchainInfo = await rpcClientObj.getBlockchainInfo();
        const networkInfo = await rpcClientObj.getNetworkInfo();

        common.response({
            id: data.id,
            type: RESPONSES.GET_INFO,
            payload: {
                url: `${loginData.host}:${loginData.port}`,
                ...utils.transformServerInfo(blockchainInfo, networkInfo),
            },
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

const getBlockHash = async (data: { id: number } & MessageTypes.GetBlockHash): Promise<void> => {
    try {
        const rpcClientObj = new RpcClient(loginData);
        const blockInfo = await rpcClientObj.getBlockHash(data.payload);
        common.response({
            id: data.id,
            type: RESPONSES.GET_BLOCK_HASH,
            payload: blockInfo,
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

const getAccountInfo = async (
    data: { id: number } & MessageTypes.GetAccountInfo
): Promise<void> => {
    let info;
    const { payload } = data;
    try {
        console.log('payload.details', payload.details);
        // tokenBalances
        if (payload.details && payload.details === 'tokens') {
            const rpcClientObj = new RpcClient(loginData);
            info = rpcClientObj.getAccountinfo(payload);
        } else if (payload.details && payload.details === 'tokenBalances') {
            const rpcClientObj = new RpcClient(loginData);
            info = await rpcClientObj.getAccountInfoWithTokenBalances(payload);
        } else {
            const socket = await connect();
            info = await socket.getAccountInfo(payload);
        }
        // xpub6BiVtCpG9fQPxnPmHXG8PhtzQdWC2Su4qWu6XW9tpWFYhxydCLJGrWBJZ5H6qTAHdPQ7pQhtpjiYZVZARo14qHiay2fvrX996oEP42u8wZy
        common.response({
            id: data.id,
            type: RESPONSES.GET_ACCOUNT_INFO,
            payload: utils.transformAccountInfo(info),
        });
        common.debug('RESPONSES.GET_ACCOUNT_INFO', RESPONSES.GET_ACCOUNT_INFO);
        common.debug('utils.transformAccountInfo(info)', utils.transformAccountInfo(info));
    } catch (error) {
        console.log('e:', error);
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
            payload: utils.transformAccountUtxo(utxos),
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

const getTransaction = async (
    data: { id: number } & MessageTypes.GetTransaction
): Promise<void> => {
    console.log('getTransaction  getTransaction getTransaction');
    const { payload } = data;
    try {
        const rpcClientObj = new RpcClient(loginData);
        const rawTxData: any = await rpcClientObj.getRawTransactionInfo(payload);
        const tx: Transaction = await rpcClientObj.convertRawTransactionToNormal(rawTxData);

        common.response({
            id: data.id,
            type: RESPONSES.GET_TRANSACTION,
            payload: {
                type: 'bitcoind',
                tx,
            },
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

const estimateFee = async (data: { id: number } & MessageTypes.EstimateFee): Promise<void> => {
    try {
        const socket = await connect();
        const resp = await socket.estimateFee(data.payload);
        common.response({
            id: data.id,
            type: RESPONSES.ESTIMATE_FEE,
            payload: resp,
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

const onNewBlock = (event: BlockNotification) => {
    common.response({
        id: -1,
        type: RESPONSES.NOTIFICATION,
        payload: {
            type: 'block',
            payload: {
                blockHeight: event.height,
                blockHash: event.hash,
            },
        },
    });
};

const onTransaction = (event: AddressNotification) => {
    if (!event.tx) return;
    const descriptor = event.address;
    // check if there is subscribed account with received address
    const account = common.getAccount(descriptor);
    common.response({
        id: -1,
        type: RESPONSES.NOTIFICATION,
        payload: {
            type: 'notification',
            payload: {
                descriptor: account ? account.descriptor : descriptor,
                tx: account
                    ? utils.transformTransaction(account.descriptor, account.addresses, event.tx)
                    : utils.transformTransaction(descriptor, undefined, event.tx),
            },
        },
    });
};

const subscribeAccounts = async (accounts: SubscriptionAccountInfo[]) => {
    common.addAccounts(accounts);
    // subscribe to new blocks, confirmed and mempool transactions for given addresses
    const socket = await connect();
    if (!common.getSubscription('notification')) {
        socket.on('notification', onTransaction);
        common.addSubscription('notification');
    }
    return socket.subscribeAddresses(common.getAddresses());
};

const subscribeAddresses = async (addresses: string[]) => {
    // common.addAddresses(addresses);
    // subscribe to new blocks, confirmed and mempool transactions for given addresses
    // const socket = await connect();
    // if (!common.getSubscription('notification')) {
    //     socket.on('notification', onTransaction);
    //     common.addSubscription('notification');
    // }
    if (!addresses[0]) {
        throw new Error('Address is not specified');
    }

    const rpcClient = new RpcClient(loginData);
    const foundedTxs: AddressNotification[] = [];

    if (subscrAddressIntervalLink) {
        clearInterval(subscrAddressIntervalLink); // clear if exist
    }

    subscrAddressIntervalLink = setInterval(async () => {
        const possibleNewBlock: BlockNotification = await rpcClient.getBlockchainInfo(true);
        const findStatus = blockSubscrData.some(oneElem => {
            return oneElem.hash === possibleNewBlock.hash;
        });

        // TODO: change to true then after testing
        if (findStatus === false) {
            blockSubscrData.unshift(possibleNewBlock);
            // foundedTxs = await rpcClient.searchAddressInBlock(addresses[0], possibleNewBlock.hash);  // TODO: fix this after testing token balance accountInfo
            // foundedTxs.forEach(oneTx => {
            //     onTransaction(oneTx);
            // });
        }
    }, 5000);

    return foundedTxs;
};

const subscribeBlock = async () => {
    const rpcClient = new RpcClient(loginData);
    const lastBlockInfo = await rpcClient.getBlockchainInfo(true);

    blockSubscrData.length = 0; // clear
    blockSubscrData.push(lastBlockInfo); // initial data, for further comparison

    if (subscrBlockIntervalLink) {
        clearInterval(subscrBlockIntervalLink); // clear if exist
    }

    subscrBlockIntervalLink = setInterval(async () => {
        const possibleNewBlock: BlockNotification = await rpcClient.getBlockchainInfo(true);
        const findStatus = blockSubscrData.some(oneElem => {
            return oneElem.hash === possibleNewBlock.hash;
        });

        if (findStatus === false) {
            blockSubscrData.unshift(possibleNewBlock);
            onNewBlock(possibleNewBlock);
        }
    }, 5000);
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

const unsubscribeBlock = async () => {
    if (subscrBlockIntervalLink) {
        clearInterval(subscrBlockIntervalLink); // clear if exist
        subscrBlockIntervalLink = undefined;
    }
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

// WebWorker message handling
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
                .then(async () => {
                    common.response({ id, type: RESPONSES.CONNECT, payload: true });
                })
                .catch(error => common.errorHandler({ id, error }));
            break;
        case MESSAGES.GET_INFO:
            getInfo(data);
            break;
        case MESSAGES.GET_BLOCK_HASH:
            getBlockHash(data);
            break;
        case MESSAGES.GET_ACCOUNT_INFO:
            getAccountInfo(data);
            break;
        case MESSAGES.GET_ACCOUNT_UTXO:
            getAccountUtxo(data);
            break;
        case MESSAGES.GET_TRANSACTION:
            getTransaction(data);
            break;
        case MESSAGES.ESTIMATE_FEE:
            estimateFee(data);
            break;
        case MESSAGES.PUSH_TRANSACTION:
            pushTransaction(data);
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
