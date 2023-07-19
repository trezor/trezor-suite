import BigNumber from 'bignumber.js';
import { toWei } from 'web3-utils';
import { isDesktop } from '@trezor/env-utils';
import type { State } from 'src/reducers/wallet/settingsReducer';
import type { CustomBackend, BlockbookUrl } from 'src/types/wallet/backend';
import type { Network } from 'src/types/wallet';

import type { BackendSettings } from '@suite-common/wallet-types';
import type { OnUpgradeFunc } from '@trezor/suite-storage';
import type { DBWalletAccountTransaction, SuiteDBSchema } from '../definitions';
import {
    formatNetworkAmount,
    networkAmountToSatoshi,
    amountToSatoshi,
} from '@suite-common/wallet-utils';
import { updateAll } from './utils';

type WalletWithBackends = {
    backends?: Partial<{
        [coin in Network['symbol']]: Omit<CustomBackend, 'coin'>;
    }>;
};

type DBWalletAccountTransactionCompatible = {
    order: DBWalletAccountTransaction['order'];
    tx: DBWalletAccountTransaction['tx'] & { totalSpent: string };
};

export const migrate: OnUpgradeFunc<SuiteDBSchema> = async (
    db,
    oldVersion,
    newVersion,
    transaction,
) => {
    console.log(`Migrating database from version ${oldVersion} to ${newVersion}`);

    // TODO: make separate file for each iterative migration

    // migrations from version older than 13 (internal releases) are not implemented
    if (oldVersion < 13) {
        // object store for wallet transactions
        const txsStore = db.createObjectStore('txs', {
            keyPath: ['tx.deviceState', 'tx.descriptor', 'tx.txid', 'tx.type'],
        });
        txsStore.createIndex('txid', 'tx.txid', { unique: false });
        txsStore.createIndex('order', 'order', { unique: false });
        txsStore.createIndex('blockTime', 'tx.blockTime', { unique: false });
        txsStore.createIndex('deviceState', 'tx.deviceState', { unique: false });
        txsStore.createIndex('accountKey', ['tx.descriptor', 'tx.symbol', 'tx.deviceState'], {
            unique: false,
        });

        // object store for settings
        db.createObjectStore('suiteSettings');
        db.createObjectStore('walletSettings');

        // object store for devices
        db.createObjectStore('devices');

        // object store for accounts
        const accountsStore = db.createObjectStore('accounts', {
            keyPath: ['descriptor', 'symbol', 'deviceState'],
        });
        accountsStore.createIndex('deviceState', 'deviceState', { unique: false });

        // object store for discovery
        db.createObjectStore('discovery', { keyPath: 'deviceState' });

        db.createObjectStore('analytics');
    }

    if (oldVersion < 14) {
        // added graph object store
        const graphStore = db.createObjectStore('graph', {
            keyPath: ['account.descriptor', 'account.symbol', 'account.deviceState'],
        });
        graphStore.createIndex('accountKey', [
            'account.descriptor',
            'account.symbol',
            'account.deviceState',
        ]);
        graphStore.createIndex('deviceState', 'account.deviceState');
    }

    if (oldVersion < 15) {
        db.createObjectStore('metadata');

        await updateAll(transaction, 'accounts', account => {
            account.metadata = {
                key: '',
                fileName: '',
                aesKey: '',
                outputLabels: {},
                addressLabels: {},
            };
            account.key = `${account.descriptor}-${account.symbol}-${account.deviceState}`;
            return account;
        });

        await updateAll(transaction, 'devices', device => {
            device.metadata = {
                status: 'disabled',
            };
            return device;
        });
    }

    if (oldVersion < 16) {
        // @ts-expect-error sendForm doesn't exists anymore
        if (db.objectStoreNames.contains('sendForm')) {
            // @ts-expect-error sendForm doesn't exists anymore
            db.deleteObjectStore('sendForm');
        }
        // object store for send form
        db.createObjectStore('sendFormDrafts');
    }

    if (oldVersion < 17) {
        db.createObjectStore('coinmarketTrades', { keyPath: 'key' });
    }

    if (oldVersion < 18) {
        await updateAll(transaction, 'devices', device => {
            device.walletNumber = device.instance;
            return device;
        });
    }

    if (oldVersion < 19) {
        // no longer uses keyPath to generate primary key
        if (db.objectStoreNames.contains('fiatRates')) {
            db.deleteObjectStore('fiatRates');
        }
        db.createObjectStore('fiatRates');
    }

    if (oldVersion < 20) {
        // enhance tx.details
        await updateAll(transaction, 'txs', tx => {
            if (tx.tx.details) {
                tx.tx.details = {
                    ...tx.tx.details,
                    vin: tx.tx.details.vin.map(v => ({
                        ...v,
                        value: v.value ? formatNetworkAmount(v.value, tx.tx.symbol) : v.value,
                    })),
                    vout: tx.tx.details.vout.map(v => ({
                        ...v,
                        value: v.value ? formatNetworkAmount(v.value, tx.tx.symbol) : v.value,
                    })),
                    totalInput: formatNetworkAmount(tx.tx.details.totalInput, tx.tx.symbol),
                    totalOutput: formatNetworkAmount(tx.tx.details.totalOutput, tx.tx.symbol),
                };
            }
            return tx;
        });
    }

    if (oldVersion < 21) {
        // do the same thing as in blockchain-link's transformTransaction
        const symbolsToExclude = ['eth', 'etc', 'xrp', 'trop', 'txrp'];
        await updateAll<'txs', DBWalletAccountTransactionCompatible>(transaction, 'txs', tx => {
            if (!tx.tx.totalSpent) {
                if (!symbolsToExclude.includes(tx.tx.symbol)) {
                    // btc-like txs
                    if (tx.tx.type === 'sent') {
                        // fix tx.amount = tx.amount - tx.fee for btc-like sent txs
                        tx.tx.totalSpent = tx.tx.amount;
                        tx.tx.amount = new BigNumber(tx.tx.amount).minus(tx.tx.fee).toString();
                    } else {
                        tx.tx.totalSpent = tx.tx.amount;
                    }
                } else if (tx.tx.type === 'sent') {
                    // eth, xrp like sent txs
                    if (tx.tx.ethereumSpecific) {
                        if (tx.tx.tokens.length > 0 || tx.tx.ethereumSpecific.status === 0) {
                            // eth with tokens (amount === fee == totalSpent)
                            tx.tx.totalSpent = tx.tx.amount;
                        } else {
                            tx.tx.totalSpent = new BigNumber(tx.tx.amount)
                                .plus(tx.tx.fee)
                                .toString();
                        }
                    } else {
                        tx.tx.totalSpent = new BigNumber(tx.tx.amount).plus(tx.tx.fee).toString();
                    }
                } else {
                    // self, recv txs
                    tx.tx.totalSpent = tx.tx.amount;
                }
                return tx;
            }
        });
    }

    if (oldVersion < 22) {
        await updateAll(transaction, 'accounts', account => {
            if (account.symbol === 'ltc' && account.accountType === 'normal') {
                // change account type from normal to segwit
                account.accountType = 'segwit';
                return account;
            }
        });

        await updateAll(transaction, 'discovery', d => {
            // reset discovery
            if (d.networks.includes('ltc')) {
                d.index = 0;
                d.loaded = 0;
                return d;
            }
        });
    }

    if (oldVersion < 23) {
        db.createObjectStore('messageSystem');
    }

    if (oldVersion < 24) {
        db.createObjectStore('formDrafts');
    }

    if (oldVersion < 25) {
        await updateAll<
            'walletSettings',
            State & {
                blockbookUrls?: BlockbookUrl[];
            } & WalletWithBackends
        >(transaction, 'walletSettings', settings => {
            if (!settings.backends && settings.blockbookUrls) {
                settings.backends = settings.blockbookUrls.reduce<{ [key: string]: any }>(
                    (backends, { coin, url, tor }) =>
                        tor // automatically torified backends should be omitted
                            ? backends
                            : {
                                  ...backends,
                                  [coin]: {
                                      type: 'blockbook',
                                      urls: [...(backends[coin]?.urls || []), url],
                                  },
                              },
                    {},
                );
                delete settings.blockbookUrls;
                return settings;
            }
        });
    }

    if (oldVersion < 26) {
        await updateAll(transaction, 'accounts', account => {
            if (account.symbol === 'vtc' && account.accountType === 'normal') {
                // change account type from normal to segwit
                account.accountType = 'segwit';
                return account;
            }
        });

        await updateAll(transaction, 'discovery', d => {
            // reset discovery
            if (d.networks.includes('vtc')) {
                d.index = 0;
                d.loaded = 0;
                return d;
            }
        });
    }

    if (oldVersion < 27) {
        const backendSettings = db.createObjectStore('backendSettings');

        await updateAll<'walletSettings', State & WalletWithBackends>(
            transaction,
            'walletSettings',
            settings => {
                const { backends = {}, ...rest } = settings;
                Object.entries(backends).forEach(([coin, { type, urls }]) => {
                    const settings: BackendSettings = {
                        selected: type,
                        urls: {
                            [type]: urls,
                        },
                    };
                    backendSettings.add(settings, coin as Network['symbol']);
                });

                return rest;
            },
        );
    }

    if (oldVersion < 28) {
        await updateAll(transaction, 'devices', device => {
            if (device.state?.includes('undefined')) {
                device.state = device.state.replace('undefined', '0');
                return device;
            }
        });

        // accounts
        const accountsStoreOld = transaction.objectStore('accounts');
        const accounts = await accountsStoreOld.getAll();
        db.deleteObjectStore('accounts');

        const accountsStoreNew = db.createObjectStore('accounts', {
            keyPath: ['descriptor', 'symbol', 'deviceState'],
        });
        accountsStoreNew.createIndex('deviceState', 'deviceState', { unique: false });

        accounts.forEach(account => {
            account.deviceState = account.deviceState.replace('undefined', '0');
            account.key = account.key.replace('undefined', '0');
            accountsStoreNew.add(account);
        });

        // transactions
        const txsStoreOld = transaction.objectStore('txs');
        const txs = await txsStoreOld.getAll();
        db.deleteObjectStore('txs');

        const txsStoreNew = db.createObjectStore('txs', {
            keyPath: ['tx.deviceState', 'tx.descriptor', 'tx.txid', 'tx.type'],
        });
        txsStoreNew.createIndex('txid', 'tx.txid', { unique: false });
        txsStoreNew.createIndex('order', 'order', { unique: false });
        txsStoreNew.createIndex('blockTime', 'tx.blockTime', { unique: false });
        txsStoreNew.createIndex('deviceState', 'tx.deviceState', { unique: false });
        txsStoreNew.createIndex('accountKey', ['tx.descriptor', 'tx.symbol', 'tx.deviceState'], {
            unique: false,
        });

        txs.forEach(tx => {
            tx.tx.deviceState = tx.tx.deviceState.replace('undefined', '0');
            txsStoreNew.add(tx);
        });

        // graph
        const graphStoreOld = transaction.objectStore('graph');
        const graphs = await graphStoreOld.getAll();
        db.deleteObjectStore('graph');

        const graphStoreNew = db.createObjectStore('graph', {
            keyPath: ['account.descriptor', 'account.symbol', 'account.deviceState'],
        });
        graphStoreNew.createIndex('accountKey', [
            'account.descriptor',
            'account.symbol',
            'account.deviceState',
        ]);
        graphStoreNew.createIndex('deviceState', 'account.deviceState');

        graphs.forEach(graph => {
            graph.account.deviceState = graph.account.deviceState.replace('undefined', '0');
            graphStoreNew.add(graph);
        });

        // discovery
        const discoveryStoreOld = transaction.objectStore('discovery');
        const discoveries = await discoveryStoreOld.getAll();
        db.deleteObjectStore('discovery');

        const discoveryStoreNew = db.createObjectStore('discovery', { keyPath: 'deviceState' });

        discoveries.forEach(discovery => {
            discovery.deviceState = discovery.deviceState.replace('undefined', '0');
            discoveryStoreNew.add(discovery);
        });
    }

    if (oldVersion < 29) {
        db.createObjectStore('firmware');

        await updateAll(transaction, 'metadata', state => {
            // @ts-expect-error (token property removed)
            if (state.provider?.token) {
                if (isDesktop()) {
                    state.provider.tokens = {
                        accessToken: '',
                        // @ts-expect-error
                        refreshToken: state.provider.token,
                    };
                }
                // @ts-expect-error
                delete state.provider.token;
                return state;
            }
        });
    }

    if (oldVersion < 30) {
        await updateAll(transaction, 'walletSettings', walletSettings => {
            if (walletSettings.bitcoinAmountUnit || !walletSettings) {
                return;
            }

            walletSettings.bitcoinAmountUnit = 0;
            return walletSettings;
        });
    }

    if (oldVersion < 31) {
        await updateAll<'txs', DBWalletAccountTransactionCompatible>(
            transaction,
            'txs',
            ({ order, tx: origTx }) => {
                const unformat = (amount: string) => networkAmountToSatoshi(amount, origTx.symbol);
                const unformatIfDefined = (amount: string | undefined) =>
                    amount ? unformat(amount) : amount;

                const unenhancedTx = {
                    ...origTx,
                    amount: unformat(origTx.amount),
                    fee: unformat(origTx.fee),
                    totalSpent: unformat(origTx.totalSpent),
                    tokens: origTx.tokens.map(tok => ({
                        ...tok,
                        amount: amountToSatoshi(tok.amount, tok.decimals),
                    })),
                    targets: origTx.targets.map(target => ({
                        ...target,
                        amount: unformatIfDefined(target.amount),
                    })),
                    ethereumSpecific: origTx.ethereumSpecific
                        ? {
                              ...origTx.ethereumSpecific,
                              gasPrice: toWei(origTx.ethereumSpecific.gasPrice, 'gwei'),
                          }
                        : undefined,
                    cardanoSpecific: origTx.cardanoSpecific
                        ? {
                              ...origTx.cardanoSpecific,
                              withdrawal: unformatIfDefined(origTx.cardanoSpecific.withdrawal),
                              deposit: unformatIfDefined(origTx.cardanoSpecific.deposit),
                          }
                        : undefined,
                    details: origTx.details && {
                        ...origTx.details,
                        vin: origTx.details.vin.map(v => ({
                            ...v,
                            value: unformatIfDefined(v.value),
                        })),
                        vout: origTx.details.vout.map(v => ({
                            ...v,
                            value: unformatIfDefined(v.value),
                        })),
                        totalInput: unformat(origTx.details.totalInput),
                        totalOutput: unformat(origTx.details.totalOutput),
                    },
                };

                return { order, tx: unenhancedTx };
            },
        );

        await updateAll(transaction, 'devices', device => {
            const { features } = device;

            device.firmwareType =
                features &&
                features.capabilities &&
                !features.capabilities.includes('Capability_Bitcoin_like')
                    ? 'bitcoin-only'
                    : 'regular';

            return device;
        });
    }

    if (oldVersion < 32) {
        db.createObjectStore('coinjoinAccounts');
    }

    if (oldVersion < 33) {
        await updateAll(transaction, 'messageSystem', messageSystem => {
            Object.values(messageSystem.dismissedMessages).forEach(dismissedMessage => {
                if (typeof dismissedMessage.feature === 'undefined') {
                    dismissedMessage.feature = false;
                }
            });

            return messageSystem;
        });
    }

    if (oldVersion < 34) {
        db.createObjectStore('coinjoinDebugSettings');
    }

    if (oldVersion < 35) {
        const accountsToUpdate = ['eth', 'etc', 'trop', 'tgor'];

        // remove ethereum network transactions
        await updateAll<'txs', DBWalletAccountTransactionCompatible>(transaction, 'txs', tx => {
            if (accountsToUpdate.includes(tx.tx.symbol)) {
                return null;
            }
            tx.tx.internalTransfers = [];
            return tx;
        });

        // force to fetch ethereum network transactions again
        await updateAll(transaction, 'accounts', account => {
            if (accountsToUpdate.includes(account.symbol)) {
                account.history = { total: 0, unconfirmed: 0, tokens: 0 };
                return account;
            }
        });
    }

    if (oldVersion < 36) {
        // remove trop network transactions, change token address to contract
        await updateAll(transaction, 'txs', tx => {
            // @ts-expect-error
            if (tx.tx.symbol === 'trop') {
                return null;
            }
            tx.tx.tokens.forEach(token => {
                // @ts-expect-error
                token.contract = token.address;
                // @ts-expect-error
                delete token.address;
            });
            return tx;
        });

        // remove trop network accounts, change token address to contract
        await updateAll(transaction, 'accounts', account => {
            // @ts-expect-error
            if (account.symbol === 'trop') {
                return null;
            }
            account.tokens?.forEach(token => {
                // @ts-expect-error
                token.contract = token.address;
                // @ts-expect-error
                delete token.address;
            });
            return account;
        });

        // remove trop from coin settings
        await updateAll(transaction, 'walletSettings', walletSettings => {
            walletSettings.enabledNetworks = walletSettings.enabledNetworks.filter(
                // @ts-expect-error
                network => network !== 'trop',
            );

            return walletSettings;
        });

        await updateAll(transaction, 'discovery', discovery => {
            // remove trop from discovery networks
            discovery.networks = discovery.networks.filter(
                // @ts-expect-error
                network => network !== 'trop',
            );
            discovery.failed = [];

            return discovery;
        });

        // remove trop from backend settings
        const backendSettings = transaction.objectStore('backendSettings');
        // @ts-expect-error
        backendSettings.delete('trop');
    }

    if (oldVersion < 37) {
        await updateAll(transaction, 'coinjoinAccounts', account => {
            delete account.session;
            // @ts-expect-error previousSessions field is removed
            delete account.previousSessions;

            return account;
        });
    }
};
