import { TrezorConnect } from '../../..';

export const blockchainEstimateFee = async (api: TrezorConnect) => {
    const simple = await api.blockchainEstimateFee({ coin: 'btc' });
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

    const smart = await api.blockchainEstimateFee({
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

    api.blockchainEstimateFee({
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

    api.blockchainEstimateFee({
        coin: 'btc',
        request: {
            feeLevels: 'preloaded',
        },
    });
};

export const blockchainGetTransactions = async (api: TrezorConnect) => {
    const txs = await api.blockchainGetTransactions({ coin: 'btc', txs: ['txid'] });
    if (txs.success) {
        txs.payload.forEach(raw => {
            raw.txid.toLowerCase();
            raw.amount.toLowerCase();
            raw.blockHash?.toLowerCase();
        });
    }
};

export const others = async (api: TrezorConnect) => {
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

    const subscribeAccounts = await api.blockchainSubscribe({
        accounts,
        coin: 'btc',
    });
    if (subscribeAccounts.success) {
        return subscribeAccounts.payload.subscribed === false ? 0 : 1;
    }

    api.blockchainSubscribe({
        coin: 'btc',
    });

    const unsubscribeAccounts = await api.blockchainUnsubscribe({
        accounts,
        coin: 'btc',
    });
    if (unsubscribeAccounts.success) {
        return unsubscribeAccounts.payload.subscribed === false ? 0 : 1;
    }

    api.blockchainUnsubscribe({
        coin: 'btc',
    });

    const disconnect = await api.blockchainDisconnect({ coin: 'btc' });
    if (disconnect.success) {
        return disconnect.payload.disconnected === false ? 0 : 1;
    }

    const customBackend = await api.blockchainSetCustomBackend({
        coin: 'btc',
        blockchainLink: undefined,
    });
    if (customBackend.success) {
        return customBackend.payload === false ? 0 : 1;
    }

    api.blockchainSetCustomBackend({
        coin: 'btc',
    });

    api.blockchainSetCustomBackend({
        coin: 'btc',
        blockchainLink: {
            type: 'blockbook',
            url: ['https://btc1.trezor.io/'],
        },
    });
};
