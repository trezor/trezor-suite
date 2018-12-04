/* @flow */

// $FlowIssue loader notation
import RippleWorker from 'worker-loader?name=js/ripple-worker.js!../workers/ripple/index.js'; // eslint-disable-line no-unused-vars
import BlockchainLink from '../index';

BlockchainLink.create({
    name: 'xrp',
    worker: 'js/ripple-worker.js',
    server: [
        'wss://s.altnet.rippletest.net',
    ],
    debug: true
});

const handleNotification = async (n) => {
    console.log("NOTIFICATIN", n)

    const notif = document.getElementById('notification');
    const div = document.createElement('div');
    notif.appendChild(div);

    const tx = n.transaction;

    if (n.status === 'closed') {
        // update accounts
        div.innerHTML = `Confirmed. From <b>${tx.Account}</b> to <b>${tx.Destination}</b>, Amount: ${formatAmount(tx.Amount)} XRP, Fee: ${formatAmount(tx.Fee)} XRP`;

        const sender = await blockchain.getAccountInfo({
            descriptor: tx.Account,
        });
        updateAccount(tx.Account, sender.payload)

        const receiver = await blockchain.getAccountInfo({
            descriptor: tx.Destination,
        });
        updateAccount(tx.Destination, receiver.payload);

        printAccounts();

    } else {
        div.innerHTML = `Pending. From <b>${tx.Account}</b> to <b>${tx.Destination}</b>`;

        addPending(tx.Account, tx, 'tx-sent');
        addPending(tx.Destination, tx, 'tx-recv');

        printAccounts();
    }
}

const addPending = (address, tx, type) => {
    const index = _accounts.findIndex(a => a.address === address);
    console.log("INDEX", index);

    const txs = _accounts[index].transactions;
    txs.unshift({
        pending: true,
        html: `<div class="tx-pending ${type}">Pending <span>${formatAmount(tx.Amount)} XRP</span></div>`,
    })
    _accounts[index] = {
        ..._accounts[index],
        transactions: txs,
    }
}

const updateAccount = (address, data) => {
    const index = _accounts.findIndex(a => a.address === address);
    _accounts[index] = {
        ..._accounts[index],
        ...data,
    }
}

const blockchain = BlockchainLink.get('xrp');
blockchain.on('block', handleNotification);
blockchain.on('address', handleNotification);


const _accounts = [];

const handleClick = async (event: MouseEvent) => {
    const target: HTMLElement = (event.target: any);
    if (target.nodeName !== 'BUTTON') return;

    
    discovery();

}

const discovery1 = async () => {
    const response = await window.TrezorConnect.rippleGetAddress({
        bundle: [
            { path: "m/44'/144'/0'/0/0", showOnTrezor: false },
            { path: "m/44'/144'/1'/0/0", showOnTrezor: false },
            { path: "m/44'/144'/2'/0/0", showOnTrezor: false },
        ]
    });

    if (!response.success) {
        console.error("Error:", response.payload.error);
    }

    await getInfo(response.payload);
    printAccounts();

}

const discovery = async () => {
    const response = await window.TrezorConnect.rippleGetAccountInfo({
        bundle: [
            { path: "m/44'/144'/0'/0/0", showOnTrezor: false },
            { path: "m/44'/144'/1'/0/0", showOnTrezor: false },
            { path: "m/44'/144'/2'/0/0", showOnTrezor: false },
        ]
    });

    console.log("RESP", response)

}

const getInfo = async (addresses: Array<{ address: string}>) => {
    return new Promise(async (resolve) => {
        for (let i = 0; i < addresses.length; i++) {
            const account = await blockchain.getAccountInfo({
                descriptor: addresses[i].address,
            });
            if (!account.error) {
                _accounts.push({
                    ...addresses[i],
                    ...account.payload
                });
            } else {
                _accounts.push({
                    ...addresses[i],
                    info: {
                        xrpBalance: 0
                    },
                    transactions: [],
                });
            }
        }

        // await blockchain.subscribe({
        //     type: 'block'
        // });

        await blockchain.subscribe({
            type: 'address',
            addresses: _accounts.map(a => a.address)
        });

        resolve();
    })
}

const printAccounts = () => {
    const selectFrom = [];
    const selectTo = [];
    const details = [];

    _accounts.forEach((a, i) => {
        console.warn("A", a)
        selectFrom.push(`<option value="${i}">Account #${(i + 1)}</option>`);
        selectTo.push(`<option value="${i}">Account #${(i + 1)}</option>`);
        details.push(`<div><b>Account #${(i + 1)}</b> ${a.address}, ${a.info.xrpBalance} XRP, sequence: ${a.info.sequence}, txs: ${a.transactions.length}`);
        a.transactions.forEach((tx, txIndex) => {
            if (txIndex < 3) {

                const txType = tx.pending ? false : tx.specification.destination.address === a.address ? 'recv' : 'sent';
                if (tx.pending) {
                    details.push(tx.html);
                } else if (txType === 'recv') {
                    details.push(`<div class="tx-recv"><span>+${tx.outcome.deliveredAmount.value}XRP</span> from ${tx.specification.source.address}</div>`);
                } else {
                    if (tx.outcome.deliveredAmount) {
                        details.push(`<div class="tx-sent"><span>-${tx.outcome.deliveredAmount.value}XRP</span> to ${tx.specification.destination.address} Fee: ${tx.outcome.fee}</div>`);
                    } else {
                        details.push(`<div class="tx-sent"><span>Failed</span> to ${tx.specification.destination.address}</div>`);
                    }
                    
                }
                details.push(`<details>${JSON.stringify(tx, null , 2)}</details>`);
            }
        })
        details.push(`</div>`);
    });

    document.getElementById('account-select').innerHTML = selectFrom.join('');
    document.getElementById('to-select').innerHTML = selectTo.join('');
    document.getElementById('details').innerHTML = details.join('');

}

const send = async () => {
    const from = document.getElementById('account-select').value;
    const to = document.getElementById('to-select').value;

    const path = 'm/' + _accounts[parseInt(from)].serializedPath;
    const sequence = _accounts[parseInt(from)].info.sequence;

    const destination = _accounts[parseInt(to)].address;
    const amount = formatAmount(document.getElementById('amount').value, true);
    
    console.log("Send", path === "m/44'/144'/0'/0/0", path, "m/44'/144'/0'/0/0");

    const tx = await TrezorConnect.rippleSignTransaction({
        path,
        transaction: {
            fee: '100000',
            flags: 0x80000000,
            sequence: parseInt(sequence),
            payment: {
                amount: amount.toString(),
                destination,
            }
        }
    });

    if (!tx.success) {
        console.error("Error:", tx.payload.error);
    }

    console.log("TX", tx.payload)

    const push = await blockchain.pushTransaction(tx.payload.serializedTx);

    console.log("TX", push)
}

const formatAmount = (amount, multiply = false) => {
    if (multiply) {
        return parseFloat(amount) * 1000000;
    } else {
        return parseInt(amount) / 1000000;
    }
}


document.getElementById('discovery').addEventListener('click', discovery);
document.getElementById('send').addEventListener('click', send);

window.__TREZOR_CONNECT_SRC = 'https://localhost:8088/';