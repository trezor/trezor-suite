import type {
    AccountInfo,
    AccountInfoParams,
    MessageTypes,
    ResponseTypes as Responses,
} from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';
import { transformTransaction } from '@trezor/blockchain-link-utils/src/ripple';
import xrpl from '@trezor/network-ripple/runtime';
import type { XrplAPI } from '@trezor/network-ripple/types';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { RESERVE } from '../reserve';
import type { Request } from '../types';

// Custom request to get account info from mempool
const getMempoolAccountInfo = async (client: XrplAPI, account: string) => {
    const response = await client.request({
        command: 'account_info',
        account,
        ledger_index: 'current',
        queue: true,
    });

    return {
        xrpBalance: response.result.account_data.Balance,
        sequence: response.result.account_data.Sequence,
        txs: response.result.queue_data ? response.result.queue_data.txn_count : 0,
    };
};

export const getAccountInfo = async (
    request: Request<MessageTypes.GetAccountInfo>,
): Promise<Responses.GetAccountInfo> => {
    const { payload } = request;

    // initial state (basic)
    const account: AccountInfo = {
        descriptor: payload.descriptor,
        balance: '0', // default balance
        availableBalance: '0', // default balance
        empty: true,
        // tokens: [], // XRP tokens are not implemented in Trezor firmware
        history: {
            // default history
            total: -1,
            unconfirmed: 0,
            transactions: undefined,
        },
        misc: {
            // default misc
            sequence: 0,
            reserve: RESERVE.BASE,
        },
    };

    try {
        const client = await request.connect();
        const info = await client.request({
            command: 'account_info',
            account: payload.descriptor,
            ledger_index: 'validated',
        });

        const ownersReserve =
            info.result.account_data.OwnerCount > 0
                ? new BigNumber(info.result.account_data.OwnerCount).times(RESERVE.OWNER).toString()
                : '0';

        const reserve = new BigNumber(RESERVE.BASE).plus(ownersReserve).toString();
        const misc = {
            sequence: info.result.account_data.Sequence,
            reserve,
        };
        account.misc = misc;
        account.balance = info.result.account_data.Balance;
        account.availableBalance = new BigNumber(account.balance).minus(reserve).toString();
        account.empty = false;
    } catch (error: unknown) {
        const { asXrplError } = await xrpl();
        // empty account throws error "actNotFound"
        // catch it and respond with empty account
        if (asXrplError(error)?.data?.error === 'actNotFound') {
            return {
                type: RESPONSES.GET_ACCOUNT_INFO,
                payload: account,
            };
        }

        throw error;
    }

    // get mempool information
    try {
        const client = await request.connect();
        const mempoolInfo = await getMempoolAccountInfo(client, payload.descriptor);
        const { misc } = account;
        const reserve: string =
            misc && typeof misc.reserve === 'string' ? misc.reserve : RESERVE.BASE;
        account.availableBalance = new BigNumber(mempoolInfo.xrpBalance).minus(reserve).toString();
        account.misc.sequence = mempoolInfo.sequence;
        account.history.unconfirmed = mempoolInfo.txs;
    } catch {
        // do not throw error for mempool (ledger_index: "current")
        // mainnet sometimes return "error": "noNetwork", "error_message": "InsufficientNetworkMode",
        // TODO: investigate
    }

    if (payload.details !== 'txs') {
        return {
            type: RESPONSES.GET_ACCOUNT_INFO,
            payload: account,
        };
    }

    const client = await request.connect();
    const response = await client.request({
        command: 'account_tx',
        account: payload.descriptor,
        ledger_index_min: payload.from ? payload.from : undefined,
        ledger_index_max: payload.to ? payload.to : undefined,
        limit: payload.pageSize || 25,
        marker: payload.marker,
        api_version: 2,
    });

    account.history.transactions = response.result.transactions.flatMap(raw =>
        raw.tx_json != null
            ? [transformTransaction(raw.hash, raw.tx_json, raw.meta, payload.descriptor)]
            : [],
    );

    return {
        type: RESPONSES.GET_ACCOUNT_INFO,
        payload: {
            ...account,
            marker: response.result.marker as AccountInfoParams['marker'],
        },
    };
};
