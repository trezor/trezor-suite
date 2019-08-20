import { WalletAccountTransaction } from '../../types';

export const addTransaction = async (_transaction: any) => {
    return Promise.resolve(1);
};

export const addTransactions = async (_transactions: any[]) => {
    return Promise.resolve(1);
};

export const getTransaction = async (_txId: string) => {
    return Promise.resolve({});
};

export const getTransactions = async (
    _accountId?: number,
    _offset?: number,
    _count?: number
): Promise<WalletAccountTransaction[]> => {
    return Promise.resolve([]);
};

export const updateTransaction = async (_txId: string, _timestamp: number) => {
    return Promise.resolve();
};

export const removeTransaction = async (_txId: string) => {
    return Promise.resolve();
};
