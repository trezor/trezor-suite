import {HDNode} from 'bitcoinjs-lib';

import {WorkerChannel} from '../lib/worker';
import {WorkerAddressSource, PrefatchingSource, CachingSource} from '../lib/address';
import {AccountDiscovery, ListDiscovery} from '../lib/discovery';
import {TxCollection} from '../lib/transaction';
import {Blockchain} from '../lib/bitcore';
import {deriveTransactionImpacts} from '../lib/history';

import h from 'virtual-dom/h';
import diff from 'virtual-dom/diff';
import patch from 'virtual-dom/patch';
import createElement from 'virtual-dom/create-element';

function createAddressSource(channel, node, addressVersion) {
    let source;
    source = new WorkerAddressSource(channel, node, addressVersion);
    source = new PrefatchingSource(source);
    source = new CachingSource(source);
    return source;
}

function createNodeFactory(xpubs) {
    return (index) => {
        if (xpubs[index]) {
            return Promise.resolve(HDNode.fromBase58(xpubs[index]));
        } else {
            return Promise.reject();
        }
    };
}

function createAccountDiscoveryFactory(blockchain, channel, nodeFactory) {
    const chunkSize = 20; // for derivation and blockchain lookup
    const gapLength = 20;
    const addressVersion = 0x0;

    return (index) => nodeFactory(index).then((node) => {
        let collection = new TxCollection();
        let external = createAddressSource(channel, node.derive(0), addressVersion);
        let internal = createAddressSource(channel, node.derive(1), addressVersion);
        return new AccountDiscovery(
            [external, internal],
            collection,
            blockchain,
            chunkSize,
            gapLength
        );
    });
}

function renderImpact(impact) {
    return h('tr', [
        h('td', impact.id),
        h('td', impact.height ? impact.height.toString() : 'unconfirmed'),
        h('td', impact.value.toString()),
        h('td', impact.type),
        h('td', impact.targets.map((t) => h('span', `${t.address} (${t.value}) `)))
    ]);
}

function renderAccount(account) {
    return h('table', account.impacts.map(renderImpact));
}

function render(state) {
    return h('div', state.map(renderAccount));
}

class Account {
    impacts: Array<TxImpact>;
    wallet: Wallet;

    constructor(impacts: Array<TxImpact>, wallet: Wallet) {
        this.impacts = impacts;
        this.wallet = wallet;
    }

    static fromDiscovery(ad: AccountDiscovery) {
        let external = ad.discoveries[0].chain;
        let internal = ad.discoveries[1].chain;
        let impacts = deriveImpacts(ad.collection, external, internal);

        let unspents = collectUnspents(ad.collection);
        let wallet = new Wallet(unspents);

        let account = new Account(impacts, wallet);
        return account;
    }
}

let state = [];
let tree = render(state);
let rootNode = createElement(tree);

document.body.appendChild(rootNode);

function refresh() {
    var newTree = render(state);
    var patches = diff(tree, newTree);
    rootNode = patch(rootNode, patches);
    tree = newTree;
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
            state[ai] = Account.fromDiscovery(ad);
            refresh();
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
