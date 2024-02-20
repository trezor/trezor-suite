import TrezorConnect from '@trezor/connect';

import { TransactionCacheEngine } from '../TransactionCacheEngine';
import { MemoryStorage } from '../MemoryStorage';
import { accountBalanceHistoryResult as btcAccountBalanceHistoryResult } from './__fixtures__/btc';
import { AccountBalanceHistory, AccountUniqueParams } from '../types';
import { accountBalanceHistoryResult as rippleAccountBalanceHistoryResult } from './__fixtures__/xrp';

jest.mock('@trezor/connect', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { connectGetAccountInfoMock } = require('./__fixtures__');
    const { DeviceModelInternal } = jest.requireActual('@trezor/connect');

    return {
        __esModule: true,
        default: {
            init: jest.fn(() => Promise.resolve()),
            getAccountInfo: jest.fn(connectGetAccountInfoMock),
            blockchainSubscribe: jest.fn(() => Promise.resolve()),
            blockchainUnsubscribe: jest.fn(() => Promise.resolve()),
        },
        DeviceModelInternal,
    };
});

const converBalanceHistoryToString = (balanceHistory: AccountBalanceHistory[]) =>
    balanceHistory.map(item => ({
        ...item,
        received: item.received.toString(),
        sent: item.sent.toString(),
        sentToSelf: item.sentToSelf.toString(),
    }));

describe('TransactionCacheEngine', () => {
    it('should add an account', async () => {
        const engine = new TransactionCacheEngine({
            storage: new MemoryStorage(),
        });
        const account: AccountUniqueParams = {
            coin: 'btc',
            descriptor: 'xpub',
        };
        await engine.addAccount(account);
        expect(await engine.accountExists(account)).toBe(true);
        // should call getAccountInfo and blockchainSubscribe
        expect(TrezorConnect.getAccountInfo).toHaveBeenCalled();
        expect(TrezorConnect.blockchainSubscribe).toHaveBeenCalled();
    });

    it('should remove an account', async () => {
        const engine = new TransactionCacheEngine({
            storage: new MemoryStorage(),
        });
        const account: AccountUniqueParams = {
            coin: 'btc',
            descriptor: 'xpub',
        };
        await engine.addAccount(account);
        expect(await engine.accountExists(account)).toBe(true);
        await engine.removeAccount(account);
        expect(await engine.accountExists(account)).toBe(false);
        // should call blockchainUnsubscribe
        expect(TrezorConnect.blockchainUnsubscribe).toHaveBeenCalled();
    });

    it('should get transactions', async () => {
        const engine = new TransactionCacheEngine({
            storage: new MemoryStorage(),
        });
        const account: AccountUniqueParams = {
            coin: 'btc',
            descriptor: 'xpub',
        };
        await engine.addAccount(account);
        const transactions = await engine.getTransactions(account);
        const expectedTransactions = await TrezorConnect.getAccountInfo({
            ...account,
            page: 1,
            pageSize: 99999999,
        });
        expect(transactions).toMatchObject(
            (expectedTransactions.payload as any).history.transactions,
        );
    });

    it('should get transactions without awaited addAccount', async () => {
        const engine = new TransactionCacheEngine({
            storage: new MemoryStorage(),
        });
        const account: AccountUniqueParams = {
            coin: 'btc',
            descriptor: 'xpub',
        };
        engine.addAccount(account);
        // get transaction should wait for addAccount even without await
        const transactions = await engine.getTransactions(account);
        const expectedTransactions = await TrezorConnect.getAccountInfo({
            ...account,
            page: 1,
            pageSize: 99999999,
        });
        expect(transactions).toMatchObject(
            (expectedTransactions.payload as any).history.transactions,
        );
    });

    it('should getAccoutBalanceHistory for bitcoin', async () => {
        const engine = new TransactionCacheEngine({
            storage: new MemoryStorage(),
        });
        const account: AccountUniqueParams = {
            coin: 'btc',
            descriptor: 'xpub',
        };
        await engine.addAccount(account);
        const balanceHistory = await engine.getAccountBalanceHistory(account);

        expect(converBalanceHistoryToString(balanceHistory)).toMatchObject(
            (await btcAccountBalanceHistoryResult).payload,
        );
    });

    it('should getAccoutBalanceHistory for ripple', async () => {
        const engine = new TransactionCacheEngine({
            storage: new MemoryStorage(),
        });
        const account: AccountUniqueParams = {
            coin: 'xrp',
            descriptor: 'xpub',
        };
        await engine.addAccount(account);
        const balanceHistory = await engine.getAccountBalanceHistory(account);

        expect(converBalanceHistoryToString(balanceHistory)).toMatchObject(
            converBalanceHistoryToString(rippleAccountBalanceHistoryResult),
        );
    });
});
