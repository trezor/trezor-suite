/* eslint-disable @typescript-eslint/no-var-requires */
const RpcClient = require('bitcoind-rpc');
const GCSFilter = require('golomb');
const Bitcoin = require('@trezor/utxo-lib');

const config = {
    protocol: 'http',
    user: 'rpc',
    pass: 'rpc',
    host: '0.0.0.0',
    port: '18021',
};

const network = {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'bcrt',
    bip32: {
        public: 0x043587cf,
        private: 0x04358394,
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef,
};

const client = new RpcClient(config);

// RpcClient calls are based on callbacks, promisify them.
const rpc = (fn, ...args) =>
    new Promise((resolve, reject) => {
        client[fn](...args, (error, value) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(value.result);
        });
    });

const rpcBatch = batchFn =>
    new Promise((resolve, reject) => {
        client.batch(batchFn, (err, res) => {
            resolve(res.map(item => item.result));
        });
    });

// rpc('getNetworkInfo').then(console.log);

// Helper for sending tx
const send = async (address, amount) => {
    const tx = await rpc('sendToAddress', address, amount);
    console.log('Tx sent', tx);
    const confirm = await rpc(
        'generateToAddress',
        1,
        'bcrt1q0y7dtpj0m307nrtp5vmzre2ju6wxsytnq99rtp'
    );
    console.log('Tx confirmed', confirm);
};
// send('miuFCJdD1gVgMVsMtb7SNmMdGCKGP5cbc5', 1);

const account = {
    descriptor:
        'pkh([c09dbfcb/44h/1h/0h]tpubDDrejUjS6BXjB2MQBpzxVqED68xiooU7bSHB1qavnUHA5M1gnoNxy8k6UubVoGLgSM28bnTnexcNDg874eVpDVUaPDKyKtA8sD1DZwuhKar/0/*)',
    addresses: [
        ['miuFCJdD1gVgMVsMtb7SNmMdGCKGP5cbc5', 'mu8Q3FXNBkvbkh2xPsX6WTeq5gGFVQSWBp'],
        ['mvi24fDsdv4znAsS8dLWH5BirRa6Vh8wVF', 'muc2oqShtuA59VLxRTxgdsb1vrHzKSAZoR'],
    ],
};

// Derive address range and convert them to script.
const derive = async (descriptor, range = 1) => {
    const addresses = await rpc('deriveAddresses', descriptor, range);
    return addresses.map(a => Bitcoin.address.toOutputScript(a, network));
};

const getDescriptorInfo = async descriptor => {
    const addresses = [];
    // get receive chain descriptor
    const chain1 = await rpc('getDescriptorInfo', account.descriptor);
    addresses.push(await derive(chain1.descriptor, [0, 20]));
    // get change chain descriptor
    const chain2 = await rpc('getDescriptorInfo', account.descriptor.replace('/0/', '/1/'));
    addresses.push(await derive(chain2.descriptor, [0, 20]));
    return addresses;
};

const getBlocksRange = async (from, to) => {
    const blocks = await rpcBatch(() => {
        for (let i = from; i <= to; i++) {
            client.getBlockHash(i);
        }
    });

    const filters = await rpcBatch(() => {
        blocks.forEach(hash => {
            if (hash) client.getBlockFilter(hash);
        });
    });

    return filters.map((item, index) => {
        const blockFilter = Buffer.from(item.filter, 'hex');
        const filter = GCSFilter.fromNBytes(19, blockFilter);
        const blockHash = Buffer.from(blocks[index], 'hex');
        const key = blockHash.reverse().slice(0, 16);
        return { hash: blocks[index], filter, key };
    });
};

const findDescriptorTxInBlock = async (blockHash, address) => {
    const block = await rpc('getBlock', blockHash);

    const rawTxs = await rpcBatch(() => {
        block.tx.forEach(txid => {
            client.getRawTransaction(txid);
        });
    });

    const decodedTxs = await rpcBatch(() => {
        rawTxs.forEach(txHex => {
            client.decodeRawTransaction(txHex);
        });
    });

    // txs to download, to get decodedTxs inputs
    const prevTxs = decodedTxs.reduce(
        (arr, tx) => arr.concat(tx.vin.flatMap(vin => (vin.txid ? vin.txid : []))),
        []
    );

    // TODO: find tx in decoded,
    // is there a better way how to check if address is participator of tx? in txHex?

    return decodedTxs;
};

const getDescriptorTxs = async (blocks, addresses) => {
    const affected = [];
    let b = 0;
    const bLen = blocks.length;
    let a = 0;
    const aLen = addresses.length;
    for (b; b < bLen; b++) {
        const block = blocks[b];
        for (a = 0; a < aLen; a++) {
            // block filter is matching address
            if (block.filter.match(block.key, addresses[a])) {
                // eslint-disable-next-line no-await-in-loop
                const txs = await findDescriptorTxInBlock(block.hash, addresses[a]);
                affected.push(txs);
            }
        }
    }
    return affected;
};

let cycle = 1;

const startDiscovery = async (descriptor, addr = null) => {
    const addresses = addr || (await getDescriptorInfo(descriptor));

    const blocks = await getBlocksRange(1, 151);
    const txs = await getDescriptorTxs(blocks, addresses[0].concat(addresses[1]));
    console.log('Account blocks', txs);
    if (cycle < 1) {
        // multiply cycles for test purposes
        cycle++;
        return startDiscovery(descriptor, addresses);
    }
};

const start = Date.now();
startDiscovery(account.descriptor).then(() => {
    console.log('<----End', Date.now() - start);
});
