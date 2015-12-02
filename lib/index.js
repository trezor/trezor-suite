import {HDNode} from 'bitcoinjs-lib';

import {WorkerChannel} from './worker';
import {WorkerAddressSource, PrefatchingSource, CachingSource} from './address';
import {AccountDiscovery, ListDiscovery} from './discovery';
import {Blockchain} from './bitcore';

function createAddressSource(channel, node, addressVersion) {
    let source;
    source = new WorkerAddressSource(channel, node, addressVersion);
    source = new PrefatchingSource(source);
    source = new CachingSource(source);
    return source;
}

function createNodeFactory(xpubs) {
    return (index) => Promise.resolve(HDNode.fromBase58(xpubs[index]));
}

function createAccountDiscoveryFactory(blockchain, channel, nodeFactory) {
    const chunkSize = 20; // for derivation and blockchain lookup
    const gapLength = 20;
    const addressVersion = 0x0;

    return (index) => nodeFactory(index).then((node) => {
        let external = createAddressSource(channel, node.derive(0), addressVersion);
        let internal = createAddressSource(channel, node.derive(1), addressVersion);
        return new AccountDiscovery([external, internal], blockchain, chunkSize, gapLength);
    });
}

function discoverList(adf) {
    // TODO: storage?

    let ld = new ListDiscovery(adf);

    ld.on('account', (ad, ai) => {
        console.time(ai);
        console.log('start', ai);

        ad.on('transaction', (record, cd, ci) => {
            console.log(ai, ci, record);
        });

        ad.on('history', (histories) => {
            console.timeEnd(ai);
            console.log(ai, 0, 'length', histories[0].nextIndex);
            console.log(ai, 1, 'length', histories[1].nextIndex);
        });

        ad.on('error', (error) => {
            console.timeEnd(ai);
            console.error(error);
        });
    });

    console.time('list');

    ld.on('end', () => {
        console.timeEnd('list');
    });

    ld.start();
}

window.run = () => {
    const XPUBS = [
        'xpub6BiVtCpG9fQPxnPmHXG8PhtzQdWC2Su4qWu6XW9tpWFYhxydCLJGrWBJZ5H6qTAHdPQ7pQhtpjiYZVZARo14qHiay2fvrX996oEP42u8wZy',
        'xpub6BiVtCpG9fQQ1EW99bMSYwySbPWvzTFRQZCFgTmV3samLSZAYU7C3f4Je9vkNh7h1GAWi5Fn93BwoGBy9EAXbWTTgTnVKAbthHpxM1fXVRL',
        'xpub6BiVtCpG9fQQ4xJHzNkdmqspAeMdBTDFZ2kYM39RzDYMAcb4wtkWZNSu7k3BbJgoPgTzx62G69mBiUjDnD3EJrTA5ZYZg4vfz1YWcGBnX2x',
        'xpub6BiVtCpG9fQQ77Qr7WArXSG3yWYm2bkRYpoSYtRkVEAk5nrcULBG8AeRYMMKVUXAsNeXdR7TGuL6SkUc4RF2YC7X4afLyZrT9NrrUFyotkH',
        'xpub6BiVtCpG9fQQ8pVjVF7jm3kLahkNbQRkWGUvzsKQpXWYvhYD4d4UDADxZUL4xp9UwsDT5YgwNKofTWRtwJgnHkbNxuzLDho4mxfS9KLesGP',
        'xpub6BiVtCpG9fQQCgxA541qm9qZ9VrGLScde4zsAMj2d15ewiMysCAnbgvSDSZXhFUdsyA2BfzzMrMFJbC4VSkXbzrXLZRitAmUVURmivxxqMJ',
        'xpub6BiVtCpG9fQQDvwDNekCEzAr3gYcoGXEF27bMwSBsCVP3bJYdUZ6m3jhv9vSG7hVxff3VEfnfK4fcMr2YRwfTfHcJwM4ioS6Eiwnrm1wcuf',
        'xpub6BiVtCpG9fQQGq7bXBjjf5zyguEXHrmxDu4t7pdTFUtDWD5epi4ecKmWBTMHvPQtRmQnby8gET7ArTzxjL4SNYdD2RYSdjk7fwYeEDMzkce'
    ];

    const TREZORCRYPTO_URL = '/lib/trezor-crypto/emscripten/trezor-crypto.js';
    const BITCORE_URL = 'http://dev.sldev.cz:3001';

    let blockchain = new Blockchain(BITCORE_URL);
    let worker = new Worker(TREZORCRYPTO_URL);
    let channel = new WorkerChannel(worker);

    blockchain.setMaxListeners(Infinity);

    let nf = createNodeFactory(XPUBS);
    let adf = createAccountDiscoveryFactory(blockchain, channel, nf);
    discoverList(adf);
};
