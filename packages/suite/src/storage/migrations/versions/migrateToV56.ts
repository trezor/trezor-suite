import { CryptoId } from 'invity-api';

import { TradingTransaction, cryptoIdToNetwork, toTokenCryptoId } from '@suite-common/trading';
import { NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import type { Account } from '@suite-common/wallet-types';
import {
    findAccountsByAddress,
    findAccountsByDescriptor,
    findAccountsByNetwork,
    getContractAddressForNetworkSymbol,
} from '@suite-common/wallet-utils';
import { OnUpgradeFunc } from '@trezor/suite-storage';

import { SuiteDBSchema } from 'src/storage/definitions';

import { updateAll } from '../utils';

const findAccountForBuyTrade = (
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

const findAccountForTrade = (
    accounts: Account[],
    address: string | undefined,
    cryptoId: CryptoId | undefined,
): Account | undefined => {
    if (!address || !cryptoId) {
        return undefined;
    }

    const network = cryptoIdToNetwork(cryptoId);
    if (!network) {
        return undefined;
    }

    const account = findAccountsByAddress(network.symbol, address, accounts).at(0);

    if (account) {
        return account;
    }

    return accounts.find(account => {
        const cryptoIds = [
            ...(account.tokens?.flatMap(token =>
                toTokenCryptoId(
                    account.symbol,
                    getContractAddressForNetworkSymbol(account.symbol, token.contract),
                ),
            ) ?? []),
            getNetwork(account.symbol).tradeCryptoId,
        ].filter(Boolean) as CryptoId[];

        return account.descriptor === address && cryptoIds.includes(cryptoId);
    });
};

export const migrateToV56: OnUpgradeFunc<SuiteDBSchema> = async (
    db,
    _oldVersion,
    _newVersion,
    transaction,
) => {
    const oldStoreName = 'coinmarketTrades';
    const newStoreName = 'tradingTrades';

    // 1. Migration coinmarketTrades to tradingTrades
    // @ts-expect-error - old type
    if (db.objectStoreNames.contains(oldStoreName)) {
        // @ts-expect-error - old type
        const trades = transaction.objectStore(oldStoreName);
        let tradesCursor = await trades.openCursor();

        const newTradesStore = db.createObjectStore(newStoreName, { keyPath: trades.keyPath });

        while (tradesCursor) {
            const trade = tradesCursor.value as TradingTransaction;

            await tradesCursor.delete();
            await newTradesStore.add(trade);

            tradesCursor = await tradesCursor.continue();
        }

        // @ts-expect-error - old type
        db.deleteObjectStore(oldStoreName);
    }

    // 2. Update trading trades to have only key of account and delete account property
    const accountsStoreOld = transaction.objectStore('accounts');
    const accounts = await accountsStoreOld.getAll();

    await updateAll(transaction, 'tradingTrades', trade => {
        if (trade.tradeType === 'buy') {
            if (trade.receiveAccountKey === undefined) {
                trade.receiveAccountKey = findAccountForTrade(
                    accounts,
                    trade.data.receiveAddress,
                    trade.data.receiveCurrency,
                )?.key;
            }

            if (!trade.selectedAccountKey) {
                trade.selectedAccountKey = findAccountForBuyTrade(
                    accounts,
                    // @ts-expect-error - account deprecated property
                    trade.account.descriptor,
                    // @ts-expect-error - account deprecated property
                    trade.account.symbol,
                )?.key;
            }

            return trade;
        }

        if (trade.tradeType === 'sell' && trade.sendAccountKey === undefined) {
            trade.sendAccountKey = findAccountForTrade(
                accounts,
                // account may be incorrect because it may not be current, but the default
                // @ts-expect-error - account deprecated property
                trade.account.descriptor,
                trade.data.cryptoCurrency,
            )?.key;

            return trade;
        }

        if (trade.tradeType === 'exchange') {
            if (trade.sendAccountKey === undefined) {
                trade.sendAccountKey = findAccountForTrade(
                    accounts,
                    // @ts-expect-error - account deprecated property
                    trade.account.descriptor,
                    trade.data.send,
                )?.key;
            }

            if (trade.receiveAccountKey === undefined) {
                trade.receiveAccountKey = findAccountForTrade(
                    accounts,
                    trade.data.receiveAddress,
                    trade.data.receive,
                )?.key;
            }

            return trade;
        }

        // @ts-expect-error - account deprecated property
        delete trade.account;

        return trade;
    });

    // 3. Update draft keys to trading
    const formDrafts = transaction.objectStore('formDrafts');
    const formDraftsKeys = (await formDrafts.getAllKeys()).filter(key =>
        key.includes('coinmarket'),
    );

    formDraftsKeys.forEach(async key => {
        const draft = await formDrafts.get(key);

        if (draft) {
            formDrafts.add(draft, key.replace('coinmarket', 'trading'));
            formDrafts.delete(key);
        }
    });

    // 4. add explorer object store, if it does not exist
    if (!db.objectStoreNames.contains('explorer')) {
        db.createObjectStore('explorer');
    }

    // 5. add thp and bluetooth object stores
    db.createObjectStore('thp');
    db.createObjectStore('bluetooth');
};
