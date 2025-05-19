import { NetworkSymbol } from '@suite-common/wallet-config';
import type { Account } from '@suite-common/wallet-types';
import { findAccountsByDescriptor, findAccountsByNetwork } from '@suite-common/wallet-utils';
import { OnUpgradeFunc } from '@trezor/suite-storage';

import { SuiteDBSchema } from 'src/storage/definitions';

import { updateAll } from '../utils';

const findAccountForTrade = (
    accounts: Account[],
    descriptor: string,
    symbol: NetworkSymbol,
): Account | undefined => {
    const account = findAccountsByDescriptor(
        descriptor,
        findAccountsByNetwork(symbol, accounts),
    ).at(0);

    if (account) {
        return account;
    }

    return undefined;
};

export const migrateToV56: OnUpgradeFunc<SuiteDBSchema> = async (
    _db,
    _oldVersion,
    _newVersion,
    transaction,
) => {
    const accountsStoreOld = transaction.objectStore('accounts');
    const accounts = await accountsStoreOld.getAll();

    await updateAll(transaction, 'tradingTrades', trade => {
        if (trade.tradeType === 'buy') {
            const selectAccountKey = findAccountForTrade(
                accounts,
                // @ts-expect-error - account deprecated property
                trade.account.descriptor,
                // @ts-expect-error - account deprecated property
                trade.account.symbol,
            )?.key;

            trade.selectedAccountKey = selectAccountKey;
        }

        // @ts-expect-error - account deprecated property
        delete trade.account;

        return trade;
    });
};
