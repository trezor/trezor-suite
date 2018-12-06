/* @flow */

// Preload workers in webpack, force webpack to compile them
// $FlowIssue loader notation
import BlockbookWorker from 'worker-loader?name=js/blockbook-worker.js!../workers/blockbook/index.js'; // eslint-disable-line no-unused-vars
// $FlowIssue loader notation
import RippleWorker from 'worker-loader?name=js/ripple-worker.js!../workers/ripple/index.js'; // eslint-disable-line no-unused-vars



import BlockchainLink from '../index';
// import BlockchainLink, { Blockchain } from '../index';
// import type { Ripple } from '../index';

const getInputValue = (id: string): string => {
    const value: string = (document.getElementById(id): any).value;
    return value;
}

const handleClick = (event: MouseEvent) => {
    const target: HTMLElement = (event.target: any);
    if (target.nodeName !== 'BUTTON') return;
    const network: string = getInputValue('network-type');

    // const blockchain: Blockchain<Ripple> = BlockchainLink.get('Ripple Testnet');
    const blockchain = instances.find(b => b.settings.name === network);
    if (!blockchain) return;

    switch (target.id) {
        case 'get-info':
            blockchain.getInfo().then(handleResponse).catch(handleError);
            break;
        case 'disconnect':
            blockchain.disconnect().then(handleResponse).catch(handleError);
            break;

        case 'get-account-info': {
            const params = network === 'ripple' ? {
                descriptor: getInputValue('get-account-info-address'),
            } : {
                descriptor: getInputValue('get-account-info-address'),
            }
            blockchain.getAccountInfo(params).then(handleResponse).catch(handleError);
            break;
        }

        case 'get-transactions':
            blockchain.getTransactions(JSON.parse(getInputValue('get-transactions'))).then(handleResponse).catch(handleError);
            break;

        case 'push-transaction':
            blockchain.pushTransaction(getInputValue('push-transaction-tx')).then(handleResponse).catch(handleError);
            break;

        case 'subscribe-block':
            blockchain.subscribe({
                type: 'block'
            }).then(handleResponse).catch(handleError);
            break;

        case 'unsubscribe-block':
            blockchain.unsubscribe({
                type: 'block'
            }).then(handleResponse).catch(handleError);
            break;

        case 'subscribe-address':
            blockchain.subscribe({
                type: 'notification',
                addresses: getInputValue('subscribe-addresses').split(","),
            }).then(handleResponse).catch(handleError);
            break;

        case 'unsubscribe-address':
            blockchain.unsubscribe({
                type: 'notification',
                addresses: getInputValue('subscribe-addresses').split(","),
            }).then(handleResponse).catch(handleError);
            break;

        case 'clear-response':
            clear('response');
            break;
        case 'clear-notification':
            clear('notification');
            break;

        default: break;
    }
}

const handleResponse = (response: any) => {
    const element = (document.getElementById('response'): any);
    element.innerHTML = JSON.stringify(response, null , 2);
}

const handleError = (error: any) => {
    const element = (document.getElementById('response'): any);
    element.innerHTML = JSON.stringify(error.message, null , 2);
}

const handleNotification = (notification: any) => {
    console.warn("HANLDE NOTIF", notification)
    const value = JSON.stringify(notification, null, 2);
    const element = (document.getElementById('notification'): any);
    element.innerHTML = `${value},\n${element.innerHTML}`;
}


// utils

const clear = (id: string) => {
    const element = (document.getElementById(id): any);
    element.innerHTML = '';
}

const prepareNetworkSelect = (instances: Array<any>, selected: string) => {
    const select = (document.getElementById('network-type'): any);
    select.innerHTML = instances.map(i => {
        if (i.name === selected) {
            return `<option value="${i.name}" selected>${i.name}</option>`;
        } else {
            return `<option value="${i.name}">${i.name}</option>`;
        }
    })
}

const config = [
    {
        name: 'Ripple Testnet',
        worker: 'js/ripple-worker.js',
        server: [
            //'wss://foo1.bar',
            //'wss://foo2.bar',
            'wss://s.altnet.rippletest.net',
        ],
        debug: true
    },
    // {
    //     name: 'Ripple Mainnet',
    //     worker: 'js/ripple-worker.js',
    //     server: 'wss://s2.ripple.com:443',
    // },
    {
        name: 'Bitcoin Testnet',
        worker: 'js/blockbook-worker.js',
        server: ['wss://blockbook-dev.corp:19136'],
        // server: 'https://testnet-bitcore1.trezor.io',
        // server: 'wss://ropsten1.trezor.io/socket.io/?transport=websocket',
        debug: true
    },
];

prepareNetworkSelect(config, 'Ripple Testnet');

const instances: Array<BlockchainLink> = [];
config.forEach(i => {
    const b = new BlockchainLink(i);
    b.on('connected', handleNotification);
    b.on('disconnected', () => console.log("---DISCONNECETD"));
    b.on('error', handleNotification);
    b.on('block', handleNotification);
    b.on('notification', handleNotification);
    instances.push(b);
});

document.addEventListener('click', handleClick);
