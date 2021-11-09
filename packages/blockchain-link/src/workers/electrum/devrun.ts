// @ts-nocheck
/// <reference path="../../../../suite/global.d.ts" />

import ElectrumWorker from '.';
import { createSocket } from './sockets';
import type { Message, Response } from '../../types';

const TOR_ADDRESS = '127.0.0.1:9050';

const TCP_CONFIG = 'electrum.corp.sldev.cz:50001:t';
const TLS_CONFIG = 'bitcoin.aranguren.org:50002:s';
const TOR_CONFIG = ''; // My personal Umbrel

const ADDR_LEGACY = '1BitcoinEaterAddressDontSendf59kuE'; // 393 transactions
const ADDR_SEGWIT = '3AVjhFvVHKhPfFccdFnPTBaqRqWq4EWoU2'; // 2 transactions
const ADDR_SEGWIT_MID = '33QJtiYPkQzYf5BNbCztHWowhco77sg18g'; // 44 transactions
const ADDR_BECH32 = 'bc1qwqdg6squsna38e46795at95yu9atm8azzmyvckulcc7kytlcckxswvvzej'; // almost 1M transactions
const XPUB_ALL_SEED_1 =
    'xpub6BiVtCpG9fQPxnPmHXG8PhtzQdWC2Su4qWu6XW9tpWFYhxydCLJGrWBJZ5H6qTAHdPQ7pQhtpjiYZVZARo14qHiay2fvrX996oEP42u8wZy';
const XPUB_ALL_SEED_2 =
    'xpub6BiVtCpG9fQQ1EW99bMSYwySbPWvzTFRQZCFgTmV3samLSZAYU7C3f4Je9vkNh7h1GAWi5Fn93BwoGBy9EAXbWTTgTnVKAbthHpxM1fXVRL';
const YPUB =
    'ypub6XKbB5DSkq8Royg8isNtGktj6bmEfGJXDs83Ad5CZ5tpDV8QofwSWQFTWP2Pv24vNdrPhquehL7vRMvSTj2GpKv6UaTQCBKZALm6RJAmxG6';
const ZPUB =
    'zpub6rDjzkRoJEhB4Z4j77umtwDFpuqDhNxWy85wZZwF6z7TM1TUw1oCucRsPHjeVNCPa29EXxFbzoPCSSbdcR66KUh9R7oPWD7XQtHuVSy47mk';
const ZPUB_FIRST = 'bc1qqmu7jr0twysm6n0zd3xz93h3jysre8aaatd6g8';
const ZPUB_SECOND = 'bc1qrhl9v6nagn9v9ckg4u63vwgzteh5wzdutj2ecd';
const TX = '353cad24cf028dc32d7be44d9b96acc112dba7705a4f3bba4be077f500cdc416';
const COINBASE_TX = '485579924ce684df7aa7a9861abb4b2858a8d917aa1df94bf3a234368a250516';
const OP_RETURN_TX = '8bae12b5f4c088d940733dcd1455efc6a3a69cf9340e17a981286d3778615684';
const MULTISIG_TX = 'aafbce314cadd619585034c4d949a59569fcf79902d3c35e162d25aa207dfb61';

const SCRIPTHASH = '495fa456cdb66064db3dae04d7b2f307a874cb6f731ab4251b7d73308001ebba';

const TX_HASH =
    '02000000000102f503777e6e86bbdc285fdc781807466ab7187496b9c13d1e11aab6a45c3a31c90000000017160014207b37056ce222c4c7511dbaa9441df907904a73feffffffc1b3e9aa635f20f98a611bee50077aa7d36bde466a0deb547df1efbceecdfec30100000000feffffff02fa990e00000000001600148775fb220c008347029e71b76e3b31a941cf588269601a00000000001976a9140093caafa7c8d442cf37b26eb79e4c4f6a9afae188ac02473044022027a921f91fd8c5a5b198c8851c08a00824f8678768964c7069bcdc498513992802203b2eb659f5b7a77a17db8093e10e0dc4b35bf6315a4f6f4fa0b2e5fd8e6895760121036761cccced49d0500e036b59f69b21f9455bcd055e005405bd6c13b11d40293602473044022036da9dd150c2d3501fa18c1f3d121999c3bd64003137f9eb68330f1833c214f202206de0a66364b5ddb0feb12b87df6f15ec5389d4201bea1f929d7d6e8ea97a2d560121021506315fd256cfad9cf15257eebbf80411a1ab0cc00de3e96ff9df4a8cd1f83608cd0a00';

(async () => {
    const worker = ElectrumWorker();

    const resolvers: { [id: number]: (value: any) => void } = {};

    worker.onmessage = ({ data }: { data: Response }) => {
        console.log('ONMESSAGE', JSON.stringify(data, null, 4));
        if (resolvers[data.id]) resolvers[data.id](data);
    };

    let id = 0;
    const sendAndWait = (data: Message) =>
        new Promise((resolve, reject) => {
            resolvers[data.id] = resolve;
            worker.postMessage(data);
        });

    worker.postMessage({
        type: 'm_handshake',
        id: 0,
        settings: {
            name: 'Electrum',
            worker: 'unknown',
            server: [TCP_CONFIG],
            debug: true,
        },
    });

    await sendAndWait({ id: ++id, type: 'm_connect' });
    // await sendAndWait({ id: ++id, type: 'm_push_tx', payload: TX_HASH });
    /* await sendAndWait({
        id: ++id,
        // @ts-ignore
        type: 'raw',
        // @ts-ignore
        payload: {
            method: 'blockchain.block.headers',
            params: [666666, 3],
        },
    });
    return;
    await sendAndWait({ id: ++id, type: 'm_get_info' });
    
    console.time('tx');
    await sendAndWait({ id: ++id, type: 'm_get_account_utxo', payload: ADDR_SEGWIT_MID });
    console.timeEnd('tx');
    return;
    
    await sendAndWait({
        id: ++id,
        type: 'm_subscribe',
        payload: { addresses: [ZPUB_FIRST], type: 'addresses' },
    });
    return;
    await sendAndWait({ id: ++id, type: 'm_get_block_hash', payload: 666666 });
    
    await sendAndWait({ id: ++id, type: 'm_get_transaction', payload: TX });
    return;
    
    await sendAndWait({
        id: ++id,
        // @ts-ignore
        type: 'raw',
        // @ts-ignore
        payload: {
            method: 'server.ping',
        },
    });

    return;
    */
    await sendAndWait({
        id: ++id,
        type: 'm_get_account_info',
        payload: { descriptor: ADDR_SEGWIT, details: 'txs' },
    });
    return;
    await sendAndWait({
        id: ++id,
        type: 'm_get_account_balance_history',
        payload: {
            descriptor: ADDR_SEGWIT,
            from: NaN,
            to: NaN,
            groupBy: 7200000,
            currencies: ['btc'],
        },
    });
    return;
    await sendAndWait({ id: ++id, type: 'm_estimate_fee', payload: { blocks: [1, 2, 10] } });
})();
