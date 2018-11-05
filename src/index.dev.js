/* @flow */

import BlockchainLink from './index';

import { NETWORKS } from './constants';

type Network = typeof NETWORKS.RIPPLE | typeof NETWORKS.BLOCKBOOK;

const getNetwork = (): Network => {
    const value: string = getInputValue('network-type');
    switch (value) {
        case NETWORKS.RIPPLE:
            return NETWORKS.RIPPLE;
        case NETWORKS.BLOCKBOOK:
            return NETWORKS.BLOCKBOOK;
        default:
            return NETWORKS.BLOCKBOOK;
    }
}

const getInputValue = (id: string): string => {
    const value: string = (document.getElementById(id): any).value;
    return value;
}


const handleClick = (event: MouseEvent) => {
    const target: HTMLElement = (event.target: any);
    if (target.nodeName !== 'BUTTON') return;
    const network: Network = getNetwork();

    switch (target.id) {
        case 'get-info':
            BlockchainLink.getInfo({
                network,
            }).then(handleResponse).catch(handleError);
            break;

        case 'get-account-info': {
            const params = network === 'ripple' ? {
                network,
                address: getInputValue('get-account-info-address'),
            } : {
                network,
                xpub: getInputValue('get-account-info-address'),
            }
            BlockchainLink.getAccountInfo(params).then(handleResponse).catch(handleError);
            break;
        }
            

        case 'push-transaction':
            BlockchainLink.pushTransaction({
                network,
                tx: getInputValue('push-transaction-tx'),
            }).then(handleResponse).catch(handleError);
            break;

        case 'subscribe':
            BlockchainLink.subscribe({
                network,
                addresses: getInputValue('subscribe-addresses').split(","),
                notificationHandler: handleNotification,
            }).then(handleResponse).catch(handleError);
            break;

        case 'clear-response':
            handleResponse('');
            break;

        default: break;
    }
}

const handleResponse = (response: any) => {
    console.log("Response", response);
    const element = (document.getElementById('response'): any);
    element.innerHTML = JSON.stringify(response, null , 2);
}

const handleNotification = (response: any) => {
    console.log("Response", response);
    var d;
    if (response.type === "ledgerClosed") {
        d = "Notification " + response.type + ": ledger_index " + response.ledger_index + ", ledger_hash " + response.ledger_hash;
    } else if (response.type === "transaction") {
        d = "Notification " + response.type + ": " + response.transaction.Account + " -> " + response.transaction.Destination +
            ", amount " + response.transaction.Amount + ", validated " + response.validated + ", status " + response.status
    } else {
        d = JSON.stringify(response, null, 2);
    }

    const element = (document.getElementById('response'): any);
    element.innerHTML = d + '\n' + element.innerHTML;
}


const handleError = (error: any) => {
    console.error(error);
    const element = (document.getElementById('response'): any);
    element.innerHTML = JSON.stringify(error.message, null , 2);
}

document.addEventListener('click', handleClick);
