const BitcoinJs = require('@trezor/utxo-lib');
const { bufferUtils } = require('@trezor/utils');

// Referenced transaction generator script.
// Transform bitcoin-like transaction data in to format required by tests of signTransaction method.
// Data are stored in <project-root>/tests/__txcache__/[network]

// Step 1.
// Go to blockchain explorer and find referenced tx by input.prev_hash and locate tx HEX
const hex = '';
if (!hex) throw new Error('tx hex not provided');

// Step 2. set network
const tx = BitcoinJs.Transaction.fromHex(hex, { network: BitcoinJs.networks.testnet });

const inputsMap = input => ({
    prev_index: input.index,
    sequence: input.sequence,
    prev_hash: bufferUtils.reverseBuffer(input.hash).toString('hex'),
    script_sig: input.script.toString('hex'),
});

const binOutputsMap = output => ({
    amount: output.value,
    script_pubkey: output.script.toString('hex'),
});

const enhanceTransaction = (refTx, srcTx) => {
    const extraData = srcTx.getExtraData();
    if (extraData) {
        refTx.extra_data = extraData.toString('hex');
    }
    const specific = srcTx.getSpecificData();
    if (specific) {
        if (specific.type === 'zcash' && specific.versionGroupId && refTx.version >= 3) {
            refTx.version_group_id = specific.versionGroupId;
        }
        if (specific.type === 'dash' && srcTx.type && srcTx.version >= 3) {
            refTx.version |= srcTx.type << 16;
        }
    }

    return refTx;
};

const refTx = enhanceTransaction(
    {
        version: tx.version,
        inputs: tx.ins.map(inputsMap),
        bin_outputs: tx.outs.map(binOutputsMap),
        lock_time: tx.locktime,
        timestamp: tx.timestamp,
        expiry: tx.expiry,
    },
    tx,
);

// Step 3. run script
// node tests/__txcache__/gen-reftx.js > tests/__txcache__/[network]/[input.prev_hash].json
// node tests/__txcache__/gen-reftx.js > tests/__txcache__/dash/adb43bcd8fc99d6ed353c30ca8e5bd5996cd7bcf719bd4253f103dfb7227f6ed.json
// node tests/__txcache__/gen-reftx.js > tests/__txcache__/testnet/f405b50dff7053f3697f485f95fe1c0f6a4f5e52446281b4ef470c2762a15dae.json
// eslint-disable-next-line no-console
console.log(JSON.stringify(refTx, null, 2));
