// Preload workers in webpack, force webpack to compile them


// import BlockbookWorker from 'worker-loader?name=js/blockbook-worker.js!../workers/blockbook/index'; // eslint-disable-line no-unused-vars
// import RippleWorker from 'worker-loader?name=js/ripple-worker.js!../workers/ripple/index'; // eslint-disable-line no-unused-vars
import * as BlockbookWorker from '../workers/blockbook/index'; // eslint-disable-line no-unused-vars
import * as RippleWorker from '../workers/ripple/index'; // eslint-disable-line no-unused-vars


import CONFIG from './config';
import BlockchainLink from '../index';

const handleClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.nodeName.toLowerCase() !== 'button') return;
    const network: string = getInputValue('network-type');

    // const blockchain: Blockchain<Ripple> = BlockchainLink.get('Ripple Testnet');
    const blockchain = instances.find(b => b.settings.name === network);
    if (!blockchain) return;

    const parentContainer = target.parentElement;
    const onResponse = handleResponse.bind(null, parentContainer);
    const onError = handleError.bind(null, parentContainer);

    switch (target.id) {
        case 'disconnect':
            blockchain.disconnect().then(onResponse).catch(onError);
            break;

        case 'get-info':
            blockchain.getInfo().then(onResponse).catch(onError);
            break;

        case 'get-account-info': {
            try {
                const options = JSON.parse(getInputValue('get-account-info-options'));
                const payload = {
                    descriptor: getInputValue('get-account-info-address'),
                    details: getInputValue('get-account-info-mode') || 'basic',
                    ...options,
                };
                blockchain.getAccountInfo(payload).then(onResponse).catch(onError);
            } catch(error) {
                onError(error);
            }
            
            break;
        }

        case 'get-account-utxo': {
            try {
                const payload = {
                    descriptor: getInputValue('get-account-utxo-address'),
                };
                blockchain.getAccountUtxo(payload).then(onResponse).catch(onError);
            } catch(error) {
                onError(error);
            }
            break;
        }
        case 'get-tx': {
            try {
                blockchain.getTransaction(getInputValue('get-tx-id')).then(onResponse).catch(onError);
            } catch(error) {
                onError(error);
            }
            break;
        }

        case 'estimate-fee':
            blockchain.estimateFee({ }).then(onResponse).catch(onError);
            break;

        case 'push-transaction':
            blockchain.pushTransaction(getInputValue('push-transaction-tx')).then(onResponse).catch(onError);
            break;

        case 'subscribe-block':
            blockchain.subscribe({
                type: 'block',
            }).catch(onError);
            break;

        case 'unsubscribe-block':
            blockchain.unsubscribe({
                type: 'block',
            }).catch(onError);
            break;

        case 'subscribe-address':
            blockchain.subscribe({
                type: 'addresses',
                addresses: getInputValue('subscribe-addresses').split(','),
            }).then(onResponse).catch(onError);
            break;

        case 'unsubscribe-address':
            blockchain.unsubscribe({
                type: 'addresses',
                addresses: getInputValue('subscribe-addresses').split(','),
            }).catch(onError);
            break;

        default: break;
    }
};

const handleResponse = (parent: any, response: any) => prepareResponse(parent, response);

const handleError = (parent: any, error: any) => prepareResponse(parent, `${error.code}: ${error.message}`, true);

const handleBlockEvent = (blockchain: BlockchainLink, notification: any): void => {
    const network: string = getInputValue('network-type');
    if (blockchain.settings.name !== network) return;
    const parent = document.getElementById('notification-block') as HTMLElement;
    prepareResponse(parent, notification);
};

const handleNotificationEvent = (blockchain: BlockchainLink, notification: any) => {
    const network: string = getInputValue('network-type');
    if (blockchain.settings.name !== network) return;

    const parent = document.getElementById('notification-address') as HTMLElement;
    prepareResponse(parent, notification);
};

const handleConnectionEvent = (blockchain: BlockchainLink, status: boolean) => {
    const parent = document.getElementById('notification-status') as HTMLElement;
    prepareResponse(parent, {
        blockchain: blockchain.settings.name,
        connected: status,
    }, !status);
};

const handleErrorEvent = (blockchain: BlockchainLink, message: any) => {
    const parent = document.getElementById('notification-status') as HTMLElement;
    prepareResponse(parent, message, true);
};

const prepareResponse = (parent: HTMLElement, response, isError: boolean = false) => {
    const div = document.createElement('pre');
    div.className = isError ? 'response error' : 'response';
    const close = document.createElement('div');
    close.className = 'close';
    close.onclick = () => {
        if (div.parentElement) div.parentElement.removeChild(div);
    };
    div.append(close);
    const pre = document.createElement('pre');
    pre.innerHTML = JSON.stringify(response, null, 2);
    div.appendChild(pre);

    const otherResponses = parent.getElementsByClassName('response');
    if (otherResponses.length > 0) {
        if (otherResponses.length >= 3) {
            parent.removeChild(otherResponses[2]);
        }
        parent.insertBefore(div, otherResponses[0]);
    } else {
        parent.appendChild(div);
    }
};


// utils

const onClear = () => {
    const responses = document.getElementsByClassName('response');
    while (responses.length) {
        const r = responses[0];
        if (r.parentElement) r.parentElement.removeChild(r);
    }
};

const getInputValue = (id: string): string => {
    const input = document.getElementById(id) as HTMLInputElement;
    return input.value;
};

const setInputValue = (id: string, value: string): void => {
    const input = document.getElementById(id) as HTMLInputElement;
    input.value = value;
};

const onSelectChange = (event) => {
    const value = event.target.value;
    const b = CONFIG.find(i => i.blockchain.name === value);
    fillValues(b ? b.data : {});
    onClear();
};

const onAccountInfoModeChange = (event) => {
    const advanced = document.getElementById('get-account-info-advanced') as HTMLElement;
    advanced.style.display = event.target.value === 'txids' || event.target.value === 'txs' ? 'block' : 'none';
};

const onEstimateFeeModeChange = (event) => {
    const advanced = document.getElementById('estimate-fee-advanced') as HTMLElement;
    advanced.style.display = event.target.value === 'advanced' ? 'block' : 'none';
};

const fillValues = (data) => {
    setInputValue('get-account-info-address', data.address);
    setInputValue('get-account-info-options', JSON.stringify(data.accountInfoOptions, null, 2));
    setInputValue('get-account-utxo-address', data.address);
    setInputValue('estimate-fee-options', JSON.stringify(data.estimateFeeOptions, null, 2));
    setInputValue('push-transaction-tx', data.tx);
    setInputValue('subscribe-addresses', data.subscribe);
};

const init = (instances: any[]) => {
    const select = document.getElementById('network-type') as HTMLSelectElement;
    select.innerHTML = instances.map((i) => {
        const b = i.blockchain;
        if (i.selected) {
            fillValues(i.data);
            return `<option value="${b.name}" selected>${b.name}</option>`;
        }
        return `<option value="${b.name}">${b.name}</option>`;
    }).join('');
    select.onchange = onSelectChange;

    const clear = document.getElementById('clear') as HTMLElement;
    clear.onclick = onClear;

    const accountInfoMode = document.getElementById('get-account-info-mode') as HTMLSelectElement;
    accountInfoMode.onchange = onAccountInfoModeChange;

    const estimateFeeMode = document.getElementById('estimate-fee-mode') as HTMLSelectElement;
    estimateFeeMode.onchange = onEstimateFeeModeChange;
};

init(CONFIG);

const instances: BlockchainLink[] = [];
CONFIG.forEach((i) => {
    const worker: any = i.blockchain.worker.indexOf('ripple') >= 0 ? RippleWorker : BlockbookWorker;
    const b = new BlockchainLink({
        ...i.blockchain,
        worker,
    });
    b.on('connected', handleConnectionEvent.bind(null, b, true));
    b.on('disconnected', handleConnectionEvent.bind(null, b, false));
    b.on('error', handleErrorEvent.bind(null, b, false));
    b.on('block', handleBlockEvent.bind(null, b));
    b.on('notification', handleNotificationEvent.bind(null, b));
    instances.push(b);
});

document.addEventListener('click', handleClick);
