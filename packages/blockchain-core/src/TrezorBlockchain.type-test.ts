import type { TrezorBlockchainApi } from './TrezorBlockchain';
import { BLOCKCHAIN, BLOCKCHAIN_EVENT } from './events';

export const estimateFee = async (api: TrezorBlockchainApi) => {
    const simple = await api.estimateFee({ coin: 'btc' });
    if (simple.success) {
        const { payload } = simple;
        payload.blockTime.toFixed();
        payload.minFee.toFixed();
        payload.maxFee.toFixed();
        // @ts-expect-error dustLimit may be undefined
        payload.dustLimit.toFixed();
        payload.dustLimit?.toFixed();

        payload.levels.forEach(level => {
            // @ts-expect-error label not present
            if (level.label === 'custom') {
                // @ts-expect-error blocks not present
                level.blocks.toFixed();
            }
            level.feePerUnit.toLowerCase();
            level.feeLimit?.toLocaleLowerCase();
            level.feePerTx?.toLocaleLowerCase();
        });
    }

    const smart = await api.estimateFee({
        coin: 'btc',
        request: { feeLevels: 'smart' },
    });
    if (smart.success) {
        const { payload } = smart;
        payload.blockTime.toFixed();
        payload.minFee.toFixed();
        payload.maxFee.toFixed();
        payload.levels.forEach(level => {
            if (level.label === 'custom') {
                level.blocks.toFixed();
            }
            if (level.label === 'normal') {
                level.feePerUnit.toLowerCase();
            }
            if (level.label === 'high' || level.label === 'low' || level.label === 'economy') {
                level.feeLimit?.toLocaleLowerCase();
                level.feePerTx?.toLocaleLowerCase();
            }
        });
    }

    api.estimateFee({
        coin: 'btc',
        request: {
            blocks: [0],
            specific: {
                conservative: true,
                data: '0x',
                from: '0x',
                to: '0x',
                txsize: 100,
            },
            feeLevels: 'smart',
        },
    });

    api.estimateFee({
        coin: 'btc',
        request: {
            feeLevels: 'preloaded',
        },
    });
};

export const getTransactions = async (api: TrezorBlockchainApi) => {
    const txs = await api.getTransactions({ coin: 'btc', txs: ['txid'] });
    if (txs.success) {
        txs.payload.forEach(raw => {
            raw.txid.toLowerCase();
            raw.amount.toLowerCase();
            raw.blockHash?.toLowerCase();
        });
    }

    const rawTxs = await api.getTransactions({
        coin: 'btc',
        txs: ['txid'],
        hexOnly: true,
    });
    if (rawTxs.success) {
        rawTxs.payload.forEach(raw => {
            raw.txid.toLowerCase();
            raw.hex.toLowerCase();
            // @ts-expect-error amount not present
            raw.amount.toLowerCase();
        });
    }
};

export const others = async (api: TrezorBlockchainApi) => {
    const accounts = [
        {
            descriptor: 'xpub',
            addresses: {
                used: [],
                unused: [],
                change: [],
            },
        },
        {
            descriptor: '0x00',
        },
    ];

    const subscribeAccounts = await api.subscribe({
        accounts,
        coin: 'btc',
    });
    if (subscribeAccounts.success) {
        return subscribeAccounts.payload.subscribed === false ? 0 : 1;
    }

    api.subscribe({
        coin: 'btc',
    });

    const unsubscribeAccounts = await api.unsubscribe({
        accounts,
        coin: 'btc',
    });
    if (unsubscribeAccounts.success) {
        return unsubscribeAccounts.payload.subscribed === false ? 0 : 1;
    }

    api.unsubscribe({
        coin: 'btc',
    });

    const disconnect = await api.disconnect({ coin: 'btc' });
    if (disconnect.success) {
        return disconnect.payload.disconnected === false ? 0 : 1;
    }

    const customBackend = await api.setCustomBackend({
        coin: 'btc',
        blockchainLink: undefined,
    });
    if (customBackend.success) {
        return customBackend.payload === false ? 0 : 1;
    }

    api.setCustomBackend({
        coin: 'btc',
    });

    api.setCustomBackend({
        coin: 'btc',
        blockchainLink: {
            type: 'blockbook',
            url: ['https://btc.trezor.io/'],
        },
    });
};

export const events = (api: TrezorBlockchainApi) => {
    api.on(BLOCKCHAIN_EVENT, event => {
        if (event.type === BLOCKCHAIN.CONNECT) {
            if (event.payload.testnet) {
                event.payload.blockHash.toLowerCase();
                event.payload.shortcut.toLowerCase();
            }
        }
        if (event.type === BLOCKCHAIN.BLOCK) {
            event.payload.blockHash.toLowerCase();
            // event.payload.blockHeight as number;
        }
        if (event.type === BLOCKCHAIN.NOTIFICATION) {
            event.payload.notification.descriptor.toLowerCase();
            event.payload.notification.tx.targets.map(t => (t.isAddress ? t.amount : t.n));
        }
    });
    api.off(BLOCKCHAIN_EVENT, () => {});

    api.on(BLOCKCHAIN.CONNECT, payload => {
        payload.blockHash.toLowerCase();
        payload.shortcut.toLowerCase();
    });

    // @ts-expect-error callback payload must match the selected event
    api.on(BLOCKCHAIN.CONNECT, (_payload: string) => {});

    api.on(BLOCKCHAIN.FIAT_RATES_UPDATE, payload => {
        payload.rates.usd?.toFixed();
    });
};
