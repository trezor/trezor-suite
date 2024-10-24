const process = require('process');

const groups = {
    api: {
        name: 'api',
        pattern:
            'init authorizeCoinjoin cancelCoinjoinAuthorization passphrase unlockPath setBusy override checkFirmwareAuthenticity keepSession cancel.test info.test',
        methods: '',
    },
    management: {
        name: 'management',
        pattern: 'methods',
        methods: 'applySettings,applyFlags,getFeatures,getFirmwareHash,changeLanguage',
    },
    btcSign: {
        name: 'btc-sign',
        pattern: 'methods',
        methods: 'signTransaction',
    },
    btcOthers: {
        name: 'btc-others',
        pattern: 'methods',
        methods:
            'getAccountInfo,getAccountDescriptor,getAddress,getPublicKey,signMessage,verifyMessage,composeTransaction,getOwnershipId,getOwnershipProof',
    },
    stellar: {
        name: 'stellar',
        pattern: 'methods',
        methods: 'stellarGetAddress,stellarSignTransaction',
    },
    cardano: {
        name: 'cardano',
        pattern: 'methods',
        methods:
            'cardanoGetAddress,cardanoGetNativeScriptHash,cardanoGetPublicKey,cardanoSignTransaction',
    },
    eos: {
        name: 'eos',
        pattern: 'methods',
        methods: 'eosGetPublicKey,eosSignTransaction',
    },
    ethereum: {
        name: 'ethereum',
        pattern: 'methods',
        methods:
            'ethereumGetAddress,ethereumGetPublicKey,ethereumSignMessage,ethereumSignTransaction,ethereumVerifyMessage,ethereumSignTypedData',
    },
    nem: {
        name: 'nem',
        pattern: 'methods',
        methods: 'nemGetAddress,nemSignTransaction',
    },
    ripple: {
        name: 'ripple',
        pattern: 'methods',
        methods: 'rippleGetAddress,rippleSignTransaction',
    },
    tezos: {
        name: 'tezos',
        pattern: 'methods',
        methods: 'tezosGetAddress,tezosGetPublicKey,tezosSignTransaction',
    },
    binance: {
        name: 'binance',
        pattern: 'methods',
        methods: 'binanceGetAddress,binanceGetPublicKey,binanceSignTransaction',
    },
};

const firmwares1 = ['1.9.0', '1-latest', '1-main'];
const firmwares2 = ['2.3.0', '2-latest', '2-main'];

const matrix = [
    {
        key: 'model',
        value: ['T1B1', 'T2T1', 'T2B1', 'T3B1', 'T3T1'],
    },
    {
        key: 'firmware',
        value: ({ model }) => {
            return model === 'T1B1' ? firmwares1 : firmwares2;
        },
    },
    {
        key: 'transport',
        value: ['Bridge', 'NodeBridge'],
    },
    {
        key: 'groups',
        value: Object.values(groups),
    },
    {
        key: 'env',
        value: ['node', 'web'],
    },
    {
        key: 'cache_tx',
        value: ['true', 'false'],
    },
];

/**
 * 
 a method that takes matrix and creates all combinations of results like this:
 {model: T1B1, firmware: 1.9.0, transport: 'Bridge' }
 {model: T1B1, firmware: 1.9.0, transport: 'NodeBridge' }
 {model: T1B1, firmware: 1-latest, transport: 'Bridge' }
 {model: T1B1, firmware: 1-latest, transport: 'NodeBridge' }
 {model: T1B1, firmware: 1-main, transport: 'Bridge' }
 {model: T1B1, firmware: 1-main, transport: 'NodeBridge' }
 {model: T2T1, firmware: 2.3.0, transport: 'Bridge' }
 {model: T2T1, firmware: 2.3.0, transport: 'NodeBridge' }
 */
const createCartesian = matrix => {
    const keys = matrix.map(m => m.key);
    const values = matrix.map(m => m.value);

    const results = [];
    const create = (index, current) => {
        if (index === keys.length) {
            results.push(current);
            return;
        }

        const key = keys[index];
        const value = typeof values[index] === 'function' ? values[index](current) : values[index];

        for (let i = 0; i < value.length; i++) {
            create(index + 1, {
                ...current,
                [key]: value[i],
            });
        }
    };

    create(0, {});
    return results;
};

const res = createCartesian(matrix);
// console.log('res', res);

const args = process.argv.slice(2);
let [model, firmware, env, groupName, cache_tx, transport] = args;
if (!model) model = 'all';
if (!firmware) firmware = 'all';
if (!env) env = 'all';
if (!groupName) groupName = 'all';
if (!cache_tx) cache_tx = 'all';
if (!transport) transport = 'all';

// console.log(
//     'model',
//     model,
//     'firmware',
//     firmware,
//     'env',
//     env,
//     'groupName',
//     groupName,
//     'cache_tx',
//     cache_tx,
//     'transport',
//     transport,
// );

const filtered = res.filter(r => {
    if (model !== 'all') {
        if (r.model !== model) return false;
    }
    if (firmware !== 'all') {
        if (r.firmware !== firmware) return false;
    }
    if (env !== 'all') {
        if (r.env !== env) return false;
    }
    if (groupName !== 'all') {
        if (r.groups.name !== groupName) return false;
    }
    if (cache_tx !== 'all') {
        if (r.cache_tx != cache_tx) return false;
    }
    if (transport !== 'all') {
        if (r.transport !== transport) return false;
    }
    return true;
});

// console.log('filtered', filtered);
// console.log('filtered.length', filtered.length);

process.stdout.write(
    JSON.stringify({
        include: filtered,
    }),
);
