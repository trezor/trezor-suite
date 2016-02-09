import {HDNode} from 'bitcoinjs-lib';

import {WorkerChannel} from '../lib/worker';
import {WorkerAddressSource, PrefatchingSource, CachingSource} from '../lib/address';
import {
    newAccountDiscovery,
    isAccountEmpty,
    discoverAccount,
    discoverPortfolio,
    lookupBlockRange
} from '../lib/discovery';
import {BitcoreBlockchain} from '../lib/bitcore';
import {deriveImpacts} from '../lib/history';
import {collectUnspents} from '../lib/wallet';

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
        let external = createAddressSource(channel, node.derive(0), addressVersion);
        let internal = createAddressSource(channel, node.derive(1), addressVersion);

        // let blocksP = lookupBlockRange(blockchain);
        let blocksP = Promise.resolve({
            sinceHeight: 0,
            untilHeight: 395626,
            untilBlock: '0000000000000000071f2097ae80c26cef6cead86603ac5edd3a4325122cd62c',
        });

        return blocksP.then((blocks) => {
            return discoverAccount(
                newAccountDiscovery(blocks),
                [external, internal],
                chunkSize,
                blockchain,
                gapLength
            );
        });
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

let appState = [];
let tree = render(appState);
let rootNode = createElement(tree);

document.body.appendChild(rootNode);

function refresh() {
    var newTree = render(appState);
    var patches = diff(tree, newTree);
    rootNode = patch(rootNode, patches);
    tree = newTree;
}

let portfolio;

function discoverList(adf) {
    let index = 0;
    portfolio = discoverPortfolio(adf, 0, 1);
    console.time('portfolio');
    portfolio.values.attach((process) => {
        let i = index++;
        process.values.attach((account) => {
            console.log(i, 'account chunk', account);
            console.log(i, 'next external addresses', account[0].history.nextIndex);
        });
        process.awaitLast().then((account) => {
            console.log(i, 'account lastChunks', account);
            console.log(i, 'next external addresses', account[0].history.nextIndex);

            let t0 = account[0].transactions;
            let t1 = account[1].transactions;

            let transactions = t0.extend(t1.asArray());
            let impacts = deriveImpacts(transactions, account[0].chain, account[1].chain);
            let unspents = collectUnspents(transactions, account[0].chain, account[1].chain);
            appState[i] = {
                account,
                transactions,
                impacts,
                unspents,
            };
            refresh();
        });
    });
    portfolio.finish.attach(() => {
        console.timeEnd('portfolio');
    });
}

window.run = () => {
    const XPUBS = [
        'xpub6Cn3A11f2HpcZAS5rvwVaiWiHkEqey4ADSAi4s2F712PCtfPiyUPQ9xWBP4thwydZQ1KTfz1tv5ZDBtu2SF5sBfup83DJgDgJBe3YaX87QD',
        /* 'xpub6BiVtCpG9fQPxnPmHXG8PhtzQdWC2Su4qWu6XW9tpWFYhxydCLJGrWBJZ5H6qTAHdPQ7pQhtpjiYZVZARo14qHiay2fvrX996oEP42u8wZy',
           'xpub6BiVtCpG9fQQ1EW99bMSYwySbPWvzTFRQZCFgTmV3samLSZAYU7C3f4Je9vkNh7h1GAWi5Fn93BwoGBy9EAXbWTTgTnVKAbthHpxM1fXVRL',
           'xpub6BiVtCpG9fQQ4xJHzNkdmqspAeMdBTDFZ2kYM39RzDYMAcb4wtkWZNSu7k3BbJgoPgTzx62G69mBiUjDnD3EJrTA5ZYZg4vfz1YWcGBnX2x',
           'xpub6BiVtCpG9fQQ77Qr7WArXSG3yWYm2bkRYpoSYtRkVEAk5nrcULBG8AeRYMMKVUXAsNeXdR7TGuL6SkUc4RF2YC7X4afLyZrT9NrrUFyotkH',
           'xpub6BiVtCpG9fQQ8pVjVF7jm3kLahkNbQRkWGUvzsKQpXWYvhYD4d4UDADxZUL4xp9UwsDT5YgwNKofTWRtwJgnHkbNxuzLDho4mxfS9KLesGP',
           'xpub6BiVtCpG9fQQCgxA541qm9qZ9VrGLScde4zsAMj2d15ewiMysCAnbgvSDSZXhFUdsyA2BfzzMrMFJbC4VSkXbzrXLZRitAmUVURmivxxqMJ',
           'xpub6BiVtCpG9fQQDvwDNekCEzAr3gYcoGXEF27bMwSBsCVP3bJYdUZ6m3jhv9vSG7hVxff3VEfnfK4fcMr2YRwfTfHcJwM4ioS6Eiwnrm1wcuf',
           'xpub6BiVtCpG9fQQGq7bXBjjf5zyguEXHrmxDu4t7pdTFUtDWD5epi4ecKmWBTMHvPQtRmQnby8gET7ArTzxjL4SNYdD2RYSdjk7fwYeEDMzkce' */
    ];

    const TREZORCRYPTO_URL = '/lib/trezor-crypto/emscripten/trezor-crypto.js';
    const BITCORE_URL = 'https://bitcore.mytrezor.com';

    let blockchain = new BitcoreBlockchain(BITCORE_URL);
    let worker = new Worker(TREZORCRYPTO_URL);
    let channel = new WorkerChannel(worker);

    let nf = createNodeFactory(XPUBS);
    let adf = createAccountDiscoveryFactory(blockchain, channel, nf);
    discoverList(adf);
};

window.stop = () => {
    process.dispose();
    console.timeEnd('portfolio');
};
