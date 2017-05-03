import {networks} from 'bitcoinjs-lib-zcash';

import {WorkerChannel} from '../lib/utils/simple-worker-channel';
import {WorkerDiscovery} from '../lib/discovery/worker-discovery';
import {BitcoreBlockchain} from '../lib/bitcore';

import h from 'virtual-dom/h';
import diff from 'virtual-dom/diff';
import patch from 'virtual-dom/patch';
import createElement from 'virtual-dom/create-element';

// setting up workers
const cryptoWorker = new Worker('./trezor-crypto.js');
const socketWorkerFactory = () => new Worker('./socket-worker.js');
const discoveryWorkerFactory = () => new Worker('./discovery-worker.js');

function renderTx(tx) {
    return h('tr', [
        h('td', tx.hash),
        h('td', tx.height ? tx.height.toString() : 'unconfirmed'),
        h('td', tx.value.toString()),
        h('td', tx.type),
        h('td', tx.targets.map((t) => h('span', `${t.address} (${t.value}) `))),
    ]);
}

function renderAccount(account) {
    if (typeof account.info === 'number') {
        return h('div', `${account.xpub} - Loading (${account.info} transactions)`);
    }
    return [h('div', `${account.xpub} - Balance: ${account.info.balance}`), h('table', account.info.transactions.map(renderTx))];
}

function render(state) {
    return h('div', state.map(renderAccount));
}

const appState = [];
const processes = [];
let tree = render(appState);
let rootNode = createElement(tree);

document.body.appendChild(rootNode);

function refresh() {
    const newTree = render(appState);
    const patches = diff(tree, newTree);
    rootNode = patch(rootNode, patches);
    tree = newTree;
}

function discover(xpubs, discovery, network) {
    let done = 0;
    xpubs.forEach((xpub, i) => {
        const process = discovery.discoverAccount(null, xpub, network);
        appState[i] = {xpub, info: 0};

        process.stream.values.attach(status => {
            appState[i] = {xpub, info: status.transactions};
            refresh();
        });
        process.ending.then(info => {
            appState[i] = {xpub, info};
            refresh();
            done++;
            if (done === xpubs.length) {
                console.timeEnd('portfolio');
            }
        });
        processes.push(process);
        refresh();
    });
    console.time('portfolio');
}

window.run = () => {
    const XPUBS = [
        'xpub6BiVtCpG9fQQ8pVjVF7jm3kLahkNbQRkWGUvzsKQpXWYvhYD4d4UDADxZUL4xp9UwsDT5YgwNKofTWRtwJgnHkbNxuzLDho4mxfS9KLesGP',
        'xpub6BiVtCpG9fQQCgxA541qm9qZ9VrGLScde4zsAMj2d15ewiMysCAnbgvSDSZXhFUdsyA2BfzzMrMFJbC4VSkXbzrXLZRitAmUVURmivxxqMJ',
        'xpub6BiVtCpG9fQQDvwDNekCEzAr3gYcoGXEF27bMwSBsCVP3bJYdUZ6m3jhv9vSG7hVxff3VEfnfK4fcMr2YRwfTfHcJwM4ioS6Eiwnrm1wcuf',
        'xpub6BiVtCpG9fQQGq7bXBjjf5zyguEXHrmxDu4t7pdTFUtDWD5epi4ecKmWBTMHvPQtRmQnby8gET7ArTzxjL4SNYdD2RYSdjk7fwYeEDMzkce',
    ];

    const BITCORE_URLS = ['https://bitcore1.trezor.io', 'https://bitcore3.trezor.io'];

    const blockchain = new BitcoreBlockchain(BITCORE_URLS, socketWorkerFactory);
    const cryptoChannel = new WorkerChannel(cryptoWorker);

    const discovery = new WorkerDiscovery(discoveryWorkerFactory, cryptoChannel, blockchain);
    const network = networks.bitcoin;
    discover(XPUBS, discovery, network);
};

window.stop = () => {
    processes.forEach(p => p.dispose());
    console.timeEnd('portfolio');
};
