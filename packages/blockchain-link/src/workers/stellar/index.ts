import { Horizon, Networks, Transaction as StellarTransaction } from '@stellar/stellar-sdk';

import type { AccountInfo, Response } from '@trezor/blockchain-link-types';
import { MESSAGES, RESPONSES } from '@trezor/blockchain-link-types/src/constants';
import { CustomError } from '@trezor/blockchain-link-types/src/constants/errors';
import type * as MessageTypes from '@trezor/blockchain-link-types/src/messages';
import * as utils from '@trezor/blockchain-link-utils/src/stellar';
import { getSuiteVersion, isDesktop, isNative } from '@trezor/env-utils';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { BaseWorker, CONTEXT, ContextType } from '../baseWorker';

const BASE_INFO = {
    BASE_RESERVE: utils.toStroops('0.5'), // 0.5 XLM, https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/accounts#base-reserves
    MINIMUM_RESERVE: utils.toStroops('1'), // 1 XLM
};

type Context = ContextType<Horizon.Server>;
type Request<T> = T & Context;

const getInfo = async (request: Request<MessageTypes.GetInfo>, isTestnet: boolean) => {
    const api = await request.connect();
    const horizonServerInfo = await api.root();
    const latestLedgerInfo = await api.ledgers().order('desc').limit(1).call();

    if (latestLedgerInfo.records.length === 0) {
        throw new CustomError('worker_invalid_horizon_response');
    }

    const latestLedgerRecord = latestLedgerInfo.records[0];
    BASE_INFO.BASE_RESERVE = new BigNumber(latestLedgerRecord.base_reserve_in_stroops);
    BASE_INFO.MINIMUM_RESERVE = BASE_INFO.BASE_RESERVE.times(2);

    const serverInfo = {
        url: api.serverURL.toString(),
        name: 'Stellar',
        shortcut: isTestnet ? 'txlm' : 'xlm',
        network: isTestnet ? 'txlm' : 'xlm',
        testnet: isTestnet,
        version: horizonServerInfo.horizon_version,
        decimals: utils.STELLAR_DECIMALS,
        blockHeight: latestLedgerRecord.sequence,
        blockHash: latestLedgerRecord.hash,
    };

    return {
        type: RESPONSES.GET_INFO,
        payload: { ...serverInfo },
    } as const;
};

const getAccountInfo = async (request: Request<MessageTypes.GetAccountInfo>) => {
    const { payload } = request;

    // initial state (basic)
    const account: AccountInfo = {
        descriptor: payload.descriptor,
        balance: '0', // default balance
        availableBalance: '0', // default balance
        empty: true,
        // tokens: [], // Let's consider implementing it later; for now, we only need to support the native token (XLM).
        history: {
            // default history
            total: -1,
            unconfirmed: 0,
            transactions: undefined,
        },
        misc: {
            // default misc
            stellarSequence: '0',
            reserve: BASE_INFO.MINIMUM_RESERVE.toString(),
        },
    };

    const api = await request.connect();
    let info;
    try {
        info = await api.accounts().accountId(payload.descriptor).call();
    } catch {
        // Account not found, we set the account as empty
        return {
            type: RESPONSES.GET_ACCOUNT_INFO,
            payload: account,
        } as const;
    }

    // Account is not empty, we can fill the account object with the data
    // https://developers.stellar.org/docs/learn/fundamentals/lumens#minimum-balance
    const reserve = BASE_INFO.MINIMUM_RESERVE.plus(
        BASE_INFO.BASE_RESERVE.times(info.subentry_count),
    );
    account.misc = {
        stellarSequence: info.sequence,
        reserve: reserve.toString(),
    };
    const nativeTokenBalance = info.balances.find(balance => balance.asset_type === 'native');
    if (!nativeTokenBalance) {
        // This should never happen, but just in case
        throw new CustomError('stellar_missing_native_balance');
    }
    const sellingLiabilities = utils.toStroops(nativeTokenBalance.selling_liabilities);
    account.balance = utils.toStroops(nativeTokenBalance.balance).toString();
    account.availableBalance = new BigNumber(account.balance)
        .minus(reserve)
        .minus(sellingLiabilities)
        .minus(BASE_INFO.BASE_RESERVE.times(info.num_sponsoring)) // See https://developers.stellar.org/docs/learn/encyclopedia/transactions-specialized/sponsored-reserves
        .plus(BASE_INFO.BASE_RESERVE.times(info.num_sponsored))
        .toString();
    account.empty = false;

    if (payload.details !== 'txs') {
        return {
            type: RESPONSES.GET_ACCOUNT_INFO,
            payload: account,
        } as const;
    }

    const requestBuilder = await api
        .transactions()
        .forAccount(payload.descriptor)
        .includeFailed(true)
        .limit(payload.pageSize || 20)
        .order('desc');
    if (payload.page && payload.page !== 1 && payload.pageCursor) {
        requestBuilder.cursor(payload.pageCursor);
    }
    const transactions = await requestBuilder.call();

    const cursor = transactions.records[transactions.records.length - 1]?.paging_token;
    account.history.transactions = transactions.records.map(record =>
        utils.transformTransaction(record, payload.descriptor),
    );

    return {
        type: RESPONSES.GET_ACCOUNT_INFO,
        payload: {
            ...account,
            stellarCursor: cursor,
        },
    } as const;
};

const estimateFee = async (request: Request<MessageTypes.EstimateFee>) => {
    const api = await request.connect();
    const feeStats = await api.feeStats();

    // We are using p70 as a fee estimation
    // https://developers.stellar.org/docs/data/horizon/api-reference/aggregations/fee-stats/object
    const stroops = feeStats.fee_charged.p70;

    const payload =
        request.payload && Array.isArray(request.payload.blocks)
            ? request.payload.blocks.map(() => ({ feePerUnit: stroops }))
            : [{ feePerUnit: stroops }];

    return {
        type: RESPONSES.ESTIMATE_FEE,
        payload,
    } as const;
};

const subscribeBlock = async ({ state, connect, post }: Context) => {
    if (state.getSubscription('block')) return { subscribed: true };

    const api = await connect();

    const es = api
        .ledgers()
        .cursor('now')
        .stream({
            onmessage: (ledger: Horizon.ServerApi.LedgerRecord) => {
                post({
                    id: -1,
                    type: RESPONSES.NOTIFICATION,
                    payload: {
                        type: 'block',
                        payload: {
                            blockHeight: Number(ledger.sequence),
                            blockHash: ledger.hash,
                        },
                    },
                });
            },
        });

    state.addSubscription('block', es);

    return { subscribed: true };
};

const unsubscribeBlock = ({ state }: Context) => {
    const es = state.getSubscription('block');

    if (es && typeof es === 'function') {
        es(); // To stop listening for new events call the function returned by this method.
        state.removeSubscription('block');
    }

    return { subscribed: false };
};

const subscribe = async (request: Request<MessageTypes.Subscribe>) => {
    let response: { subscribed: boolean };
    switch (request.payload.type) {
        case 'block':
            response = await subscribeBlock(request);
            break;
        case 'accounts':
        case 'addresses':
            // https://github.com/trezor/trezor-suite/pull/16483#issuecomment-2869536172
            response = { subscribed: false };
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
    let response: { subscribed: boolean };
    switch (request.payload.type) {
        case 'block':
            response = unsubscribeBlock(request);
            break;
        case 'accounts':
        case 'addresses':
            response = { subscribed: false };
            break;
        default:
            throw new CustomError('worker_unknown_request', `+${request.type}`);
    }

    return {
        type: RESPONSES.UNSUBSCRIBE,
        payload: response,
    } as const;
};

const pushTransaction = async ({ connect, payload }: Request<MessageTypes.PushTransaction>) => {
    const api = await connect();
    const base64EncodedTx = Buffer.from(payload, 'hex').toString('base64');
    const parsedTx = new StellarTransaction(base64EncodedTx, Networks.PUBLIC);
    try {
        const resp = await api.submitTransaction(parsedTx, { skipMemoRequiredCheck: true });

        return {
            type: RESPONSES.PUSH_TRANSACTION,
            payload: resp.hash,
        } as const;
    } catch (e) {
        const txResultCode: string =
            e?.response?.data?.extras?.result_codes?.transaction || 'unknown';
        const opResultCode: string =
            e?.response?.data?.extras?.result_codes?.operations?.[0] || 'unknown';
        throw new Error(
            `transaction result code: ${txResultCode}, operation result code: ${opResultCode}`,
        );
    }
};

const onRequest = (request: Request<MessageTypes.Message>, isTestnet: boolean) => {
    switch (request.type) {
        case MESSAGES.GET_INFO:
            return getInfo(request, isTestnet);
        case MESSAGES.GET_ACCOUNT_INFO:
            return getAccountInfo(request);
        case MESSAGES.ESTIMATE_FEE:
            return estimateFee(request);
        case MESSAGES.PUSH_TRANSACTION:
            return pushTransaction(request);
        case MESSAGES.SUBSCRIBE:
            return subscribe(request);
        case MESSAGES.UNSUBSCRIBE:
            return unsubscribe(request);
        default:
            throw new CustomError('worker_unknown_request', `+${request.type}`);
    }
};

class StellarWorker extends BaseWorker<Horizon.Server> {
    private isTestnet = false;

    protected isConnected(api: Horizon.Server | undefined): api is Horizon.Server {
        return !!api;
    }

    async tryConnect(url: string): Promise<Horizon.Server> {
        const api = new Horizon.Server(url, {
            headers: {
                ...(isDesktop() || isNative()
                    ? { 'User-Agent': `Trezor Suite ${getSuiteVersion()}` }
                    : {}),
            },
        });

        if ((await api.root()).network_passphrase == Networks.TESTNET) {
            this.isTestnet = true;
        }

        return api;
    }

    disconnect() {
        if (!this.api) {
            return;
        }

        unsubscribeBlock(this);

        this.api = undefined;
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

            const response = await onRequest(request, this.isTestnet);
            this.post({ id: event.data.id, ...response });
        } catch (error) {
            this.errorResponse(event.data.id, error);
        }
    }
}

// export worker factory used in src/index
export default function Stellar() {
    return new StellarWorker();
}

if (CONTEXT === 'worker') {
    // Initialize module if script is running in worker context
    const module = new StellarWorker();
    onmessage = module.messageHandler.bind(module);
}
