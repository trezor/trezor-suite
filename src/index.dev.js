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

        case 'subscribe':
            blockchain.subscribe({
                addresses: document.getElementById('subscribe-addresses').value.split(","),
                notificationHandler: handleNotification,
                network: networkType,
            }).then(handleResponse).catch(handleError);
            break;

        case 'clear-response':
            document.getElementById('response').innerHTML = "";
            break;

        default: break;
    }
}

const handleResponse = (response: any) => {
    console.log("Response", response);
    document.getElementById('response').innerHTML = JSON.stringify(response, null, 2) + '\n' + document.getElementById('response').innerHTML;
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
    document.getElementById('response').innerHTML = d + '\n' + document.getElementById('response').innerHTML;
}


const handleError = (error: any) => {
    console.error(error);
}

document.addEventListener('click', handleClick);
