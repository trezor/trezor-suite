import type { OnUpgradeFunc } from '@trezor/suite-storage';

import { updateAll } from '../utils';
import type { SuiteDBSchema } from '../../definitions';

export const migrationOfBnbNetwork: OnUpgradeFunc<SuiteDBSchema> = async (
    _db,
    _oldVersion,
    _newVersion,
    transaction,
) => {
    //  migrate bnb to bsc

    await updateAll(transaction, 'walletSettings', walletSettings => {
        // @ts-expect-error
        const indexOfBnb = walletSettings.enabledNetworks.indexOf('bnb');
        if (indexOfBnb !== -1) {
            walletSettings.enabledNetworks[indexOfBnb] = 'bsc';
        }

        return walletSettings;
    });

    await updateAll(transaction, 'suiteSettings', suiteSettings => {
        if (
            // @ts-expect-error
            typeof suiteSettings.evmSettings?.confirmExplanationModalClosed?.bnb == 'boolean'
        ) {
            suiteSettings.evmSettings.confirmExplanationModalClosed.bsc =
                // @ts-expect-error
                suiteSettings.evmSettings.confirmExplanationModalClosed.bnb;
            // @ts-expect-error
            delete suiteSettings.evmSettings.confirmExplanationModalClosed.bnb;
        }

        if (
            // @ts-expect-error
            typeof suiteSettings.evmSettings?.explanationBannerClosed?.bnb == 'boolean'
        ) {
            suiteSettings.evmSettings.explanationBannerClosed.bsc =
                // @ts-expect-error
                suiteSettings.evmSettings.explanationBannerClosed.bnb;
            // @ts-expect-error
            delete suiteSettings.evmSettings.explanationBannerClosed.bnb;
        }

        return suiteSettings;
    });

    const backendSettings = transaction.objectStore('backendSettings');
    // @ts-expect-error
    const bnbBackendSettings = await backendSettings.get('bnb');
    if (bnbBackendSettings) {
        backendSettings.add(bnbBackendSettings, 'bsc');
        // @ts-expect-error
        backendSettings.delete('bnb');
    }

    const tokenManagement = transaction.objectStore('tokenManagement');
    const bnbTokenManagementShow = await tokenManagement.get('bnb-coin-show');
    if (bnbTokenManagementShow) {
        tokenManagement.add(bnbTokenManagementShow, 'bsc-coin-show');
        tokenManagement.delete('bnb-coin-show');
    }

    const bnbTokenManagementHide = await tokenManagement.get('bnb-coin-hide');
    if (bnbTokenManagementHide) {
        tokenManagement.add(bnbTokenManagementHide, 'bsc-coin-hide');
        tokenManagement.delete('bnb-coin-hide');
    }

    await updateAll(transaction, 'discovery', discovery => {
        discovery.networks = discovery.networks.map(network =>
            // @ts-expect-error
            network === 'bnb' ? 'bsc' : network,
        );

        discovery.failed = discovery.failed.map(network => {
            // @ts-expect-error
            if (network.symbol === 'bnb') {
                network = { ...network, symbol: 'bsc' };
            }

            return network;
        });

        return discovery;
    });

    const accounts = transaction.objectStore('accounts');
    let accountsCursor = await accounts.openCursor();
    while (accountsCursor) {
        const account = accountsCursor.value;
        // @ts-expect-error
        if (account.symbol === 'bnb') {
            const newAccount = {
                ...account,
                symbol: 'bsc' as const,
                key: account.key.replace('bnb', 'bsc'),
            };
            await accountsCursor.delete();
            await accounts.add(newAccount);
        }

        accountsCursor = await accountsCursor.continue();
    }

    await updateAll(transaction, 'walletSettings', walletSettings => {
        if (walletSettings.lastUsedFeeLevel['bnb']) {
            walletSettings.lastUsedFeeLevel = {
                ...walletSettings.lastUsedFeeLevel,
                bsc: { ...walletSettings.lastUsedFeeLevel['bnb'] },
            };

            delete walletSettings.lastUsedFeeLevel['bnb'];
        }

        return walletSettings;
    });

    await updateAll(transaction, 'txs', tx => {
        // @ts-expect-error
        if (tx.tx.symbol === 'bnb') {
            tx.tx = { ...tx.tx, symbol: 'bsc' };
        }

        return tx;
    });

    const graphs = transaction.objectStore('graph');
    let graphCursor = await graphs.openCursor();
    while (graphCursor) {
        const graph = graphCursor.value;
        //@ts-expect-error
        if (graph.account.symbol === 'bnb') {
            const newGraph = {
                ...graph,
                account: { ...graph.account, symbol: 'bsc' as const },
            };
            await graphCursor.delete();
            await graphs.add(newGraph);
        }

        graphCursor = await graphCursor.continue();
    }

    await updateAll(transaction, 'historicRates', rates => {
        const rate = Object.keys(rates).reduce((newRates, key) => {
            const newKey = key.replace('bnb', 'bsc');
            // @ts-expect-error
            newRates[newKey] = rates[key];

            return newRates;
        }, {});

        return rate;
    });

    const historicRates = transaction.objectStore('historicRates');
    const historicRatesKeys = await historicRates.getAllKeys();
    const historicRatesKeysWithBnb = historicRatesKeys.filter(key => key.includes('bnb'));

    historicRatesKeysWithBnb.forEach(async key => {
        const rate = await historicRates.get(key);
        if (rate) {
            historicRates.add(rate, key.replace('bnb', 'bsc'));
        }
        historicRates.delete(key);
    });

    const sendFormDrafts = transaction.objectStore('sendFormDrafts');
    const sendFormDraftsKeys = await sendFormDrafts.getAllKeys();
    const sendFormDraftsKeysWithBnb = sendFormDraftsKeys.filter(key => key.includes('bnb'));

    sendFormDraftsKeysWithBnb.forEach(async key => {
        const draft = await sendFormDrafts.get(key);
        if (draft) {
            sendFormDrafts.add(draft, key.replace('bnb', 'bsc'));
        }
        sendFormDrafts.delete(key);
    });

    const formDrafts = transaction.objectStore('formDrafts');
    const formDraftsKeys = await formDrafts.getAllKeys();
    const formDraftsKeysWithBnb = formDraftsKeys.filter(key => key.includes('bnb'));

    formDraftsKeysWithBnb.forEach(async key => {
        const draft = await formDrafts.get(key);
        if (draft) {
            formDrafts.add(draft, key.replace('bnb', 'bsc'));
        }
        formDrafts.delete(key);
    });

    await updateAll(transaction, 'coinmarketTrades', trade => {
        // @ts-expect-error
        if (trade.account.symbol === 'bnb') {
            trade.account.symbol = 'bsc';
        }
    });
};
