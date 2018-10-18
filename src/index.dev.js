/* @flow */

import BlockchainLink from './index';


const blockchain = new BlockchainLink();


const handleClick = (event: MouseEvent) => {
    if (event.target.nodeName !== 'BUTTON') return;

    const networkType = document.getElementById('network-type').value;

    switch (event.target.id) {
        case 'get-info':
            blockchain.getInfo({
                network: networkType,
            }).then(handleResponse).catch(handleError);
            break;

        case 'get-account-info':
            blockchain.getAccountInfo({
                address: document.getElementById('get-account-info-address').value,
                network: networkType,
            }).then(handleResponse).catch(handleError);
            break;

        case 'push-transaction':
            blockchain.pushTransaction({
                tx: document.getElementById('push-transaction-tx').value,
                network: networkType,
            }).then(handleResponse).catch(handleError);
            break;

        default: break;
    }
}

const handleResponse = (response: any) => {
    console.log("Response", response);
    document.getElementById('response').innerHTML = JSON.stringify(response, null , 2);
}

const handleError = (error: any) => {
    console.error(error);
}

document.addEventListener('click', handleClick);
