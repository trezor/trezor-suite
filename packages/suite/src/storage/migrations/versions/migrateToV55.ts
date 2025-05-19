import { CryptoId } from 'invity-api';

import { cryptoIdToNetwork, toTokenCryptoId } from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import type { Account } from '@suite-common/wallet-types';
import {
    findAccountsByAddress,
    getContractAddressForNetworkSymbol,
} from '@suite-common/wallet-utils';
import { OnUpgradeFunc } from '@trezor/suite-storage';

import { SuiteDBSchema } from 'src/storage/definitions';

import { updateAll } from '../utils';
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

export const migrateToV55: OnUpgradeFunc<SuiteDBSchema> = async (
    _db,
    _oldVersion,
    _newVersion,
    transaction,
) => {
    const accountsStoreOld = transaction.objectStore('accounts');
    const accounts = await accountsStoreOld.getAll();

    await updateAll(transaction, 'tradingTrades', trade => {
        if (trade.tradeType === 'buy' && trade.receiveAccountKey === undefined) {
            trade.receiveAccountKey = findAccountForTrade(
                accounts,
                trade.data.receiveAddress,
                trade.data.receiveCurrency,
            )?.key;

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
    });
};
