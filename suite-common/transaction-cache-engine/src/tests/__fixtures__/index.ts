import { AccountInfo, Response as ConnectResponse, Params } from '@trezor/connect';
import { GetAccountInfo } from '@trezor/connect/lib/types/api/getAccountInfo';

import { accountInfoResult as btcAccountInfoResult } from './btc';
import { accountInfoResult as xrpAccountInfoResult } from './xrp';

const paginateAccountInfoResult = (
    { pageSize, page }: { pageSize: number; page: number },
    accountInfoResult: AccountInfo,
) => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const { transactions } = accountInfoResult.history;

    if (!transactions) return accountInfoResult;

    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    return {
        ...accountInfoResult,
        history: {
            ...accountInfoResult.history,
            page,

            transactions: paginatedTransactions,
        },
        page: {
            ...accountInfoResult.page,
            index: page,
            size: pageSize,
            total: Math.ceil(transactions.length / pageSize),
        },
    };
};

const results: Record<string, ConnectResponse<AccountInfo>> = {
    btc: btcAccountInfoResult,
    xrp: xrpAccountInfoResult,
};

export const connectGetAccountInfoMock = async ({
    page,
    pageSize,
    coin,
}: Params<GetAccountInfo>) => {
    const mockResult = await results[coin];
    if (!mockResult) throw new Error(`Mock result for coin ${coin} not found`);

    if (coin === 'xrp') return xrpAccountInfoResult;

    if (!page || !pageSize) throw new Error(`Page or pageSize not provided`);

    if (mockResult.success === false) return mockResult;

    const paginatedAccountInfoResult = paginateAccountInfoResult(
        { page, pageSize },
        mockResult.payload,
    );

    return {
        success: true,
        payload: paginatedAccountInfoResult,
    };
};
