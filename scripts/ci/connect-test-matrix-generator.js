const process = require('process');

const DEBUG = false;

const log = (...args) => {
    if (DEBUG) {
        return console.log(...args);
    }
};

const groups = {
    api: {
        name: 'api',
        pattern:
            'init authorizeCoinjoin cancelCoinjoinAuthorization passphrase unlockPath setBusy checkFirmwareAuthenticity keepSession cancel.test info.test',
        includeFilter: '',
    },
    // temporarily created group for flaky test - to spend less time on reruns and to make test result in CI more readable without investigating long logs
    apiFlaky: {
        name: 'api-flaky',
        pattern: 'override',
    },
    management: {
        name: 'management',
        pattern: 'methods',
        includeFilter:
            'applySettings,applyFlags,getFeatures,getFirmwareHash,changeLanguage,loadDevice',
    },
    btcSign: {
        name: 'btc-sign',
        pattern: 'methods',
        includeFilter: 'signTransaction',
    },
    btcOthers: {
        name: 'btc-others',
        pattern: 'methods',
        includeFilter:
            'getAccountInfo,getAccountDescriptor,getAddress,getPublicKey,signMessage,verifyMessage,composeTransaction,getOwnershipId,getOwnershipProof',
    },
    stellar: {
        name: 'stellar',
        pattern: 'methods',
        includeFilter: 'stellarGetAddress,stellarSignTransaction',
    },
    cardano: {
        name: 'cardano',
        pattern: 'methods',
        includeFilter:
            'cardanoGetAddress,cardanoGetNativeScriptHash,cardanoGetPublicKey,cardanoSignTransaction',
    },
    eos: {
        name: 'eos',
        pattern: 'methods',
        includeFilter: 'eosGetPublicKey,eosSignTransaction',
    },
    ethereum: {
        name: 'ethereum',
        pattern: 'methods',
        includeFilter:
            'ethereumGetAddress,ethereumGetPublicKey,ethereumSignMessage,ethereumSignTransaction,ethereumVerifyMessage,ethereumSignTypedData',
    },
    nem: {
        name: 'nem',
        pattern: 'methods',
        includeFilter: 'nemGetAddress,nemSignTransaction',
    },
    ripple: {
        name: 'ripple',
        pattern: 'methods',
        includeFilter: 'rippleGetAddress,rippleSignTransaction',
    },
    tezos: {
        name: 'tezos',
        pattern: 'methods',
        includeFilter: 'tezosGetAddress,tezosGetPublicKey,tezosSignTransaction',
    },
    binance: {
        name: 'binance',
        pattern: 'methods',
        includeFilter: 'binanceGetAddress,binanceGetPublicKey,binanceSignTransaction',
    },
};

const firmwares1 = ['1.9.0', '1-latest', '1-main'];
const firmwares2 = ['2.3.0', '2-latest', '2-main'];

const inputs = [
    {
        key: 'model',
        value: ['T1B1', 'T2T1', 'T2B1', 'T3B1', 'T3T1', 'T3W1'],
    },

    {
        key: 'firmware',
        value: ({ model }) => {
            return model === 'T1B1' ? firmwares1 : firmwares2;
        },
    },
    {
        key: 'transport',
        value: ['2.0.32', '2.0.33', 'node-bridge'],
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
    {
        key: 'key',
        value: [' '],
    },
];

// Get command-line arguments, excluding 'node' and the script name
const args = process.argv.slice(2);

// Initialize an object to store the parsed arguments
const parsedArgs = {
    key: ' ',
};

// Iterate over the arguments
args.forEach(arg => {
    // Split each argument by '=' to separate the key and value
    const [key, value] = arg.split('=');

    // Remove the leading '--' from the key
    const argName = key.replace(/^--/, '');

    // Check if the value contains commas to create an array
    parsedArgs[argName] = value.includes(',') ? value.split(',') : value;
});

log('parsedArgs', parsedArgs);

const validateArgs = () => {
    const requiredArgs = ['model', 'firmware', 'env', 'groups', 'cache_tx', 'transport'];

    requiredArgs.forEach(arg => {
        if (!parsedArgs[arg]) {
            throw new Error(`Missing required argument: ${arg}`);
        }
    });
};

validateArgs();

log('validated args', parsedArgs);

/**
 a method that takes inputs and creates all combinations of results like this:
 {model: T1B1, firmware: 1.9.0, transport: 'Bridge'... }
 {model: T1B1, firmware: 1.9.0, transport: 'NodeBridge'... }
 {model: T1B1, firmware: 1-latest, transport: 'Bridge'... }
 {model: T1B1, firmware: 1-latest, transport: 'NodeBridge'... }
 */
const createCartesian = inputs => {
    const keys = inputs.map(m => m.key);
    const values = inputs.map(m => m.value);

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

const cartesian = createCartesian(inputs);

log('cartesian length', cartesian.length);

/**
 * filter cartesian by passed arguments
 */
const filterCartesianResultByArgs = () => {
    const getValue = input => {
        if (typeof input === 'object') {
            return input.name;
        }
        return input;
    };

    return cartesian.filter(m => {
        return Object.keys(m).every(key => {
            const filterBy = parsedArgs[key];
            if (filterBy === 'all') return true;
            if (Array.isArray(filterBy)) {
                return filterBy.includes(getValue(m[key]));
            }
            return getValue(m[key]) === filterBy;
        });
    });
};

const filtered = filterCartesianResultByArgs();

log('filtered.length', filtered.length);

if (!DEBUG) {
    process.stdout.write(
        JSON.stringify({
            include: filtered,
        }),
    );
}
