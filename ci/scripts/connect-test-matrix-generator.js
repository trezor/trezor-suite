const process = require('process');

const daily = {
    firmwares: ['2-latest'],
    tests: [
        {
            name: 'api',
            pattern:
                'init authorizeCoinjoin cancelCoinjoinAuthorization passphrase unlockPath setBusy override checkFirmwareAuthenticity',
            methods: '',
        },
        {
            name: 'management',
            pattern: 'methods',
            methods: 'applySettings,applyFlags,getFeatures,getFirmwareHash',
        },
        {
            name: 'btc-sign',
            pattern: 'methods',
            methods: 'signTransaction',
        },
        {
            name: 'btc-others',
            pattern: 'methods',
            methods:
                'getAccountInfo,getAccountDescriptor,getAddress,getPublicKey,signMessage,verifyMessage,composeTransaction,getOwnershipId,getOwnershipProof',
        },
        {
            name: 'stellar',
            pattern: 'methods',
            methods: 'stellarGetAddress,stellarSignTransaction',
        },
        {
            name: 'cardano',
            pattern: 'methods',
            methods:
                'cardanoGetAddress,cardanoGetNativeScriptHash,cardanoGetPublicKey,cardanoSignTransaction',
        },
        {
            name: 'eos',
            pattern: 'methods',
            methods: 'eosGetPublicKey,eosSignTransaction',
        },
        {
            name: 'ethereum',
            pattern: 'methods',
            methods:
                'ethereumGetAddress,ethereumGetPublicKey,ethereumSignMessage,ethereumSignTransaction,ethereumVerifyMessage,ethereumSignTypedData',
        },
        {
            name: 'nem',
            pattern: 'methods',
            methods: 'nemGetAddress,nemSignTransaction',
        },
        {
            name: 'ripple',
            pattern: 'methods',
            methods: 'rippleGetAddress,rippleSignTransaction',
        },
        {
            name: 'tezos',
            pattern: 'methods',
            methods: 'tezosGetAddress,tezosGetPublicKey,tezosSignTransaction',
        },
        {
            name: 'binance',
            pattern: 'methods',
            methods: 'binanceGetAddress,binanceGetPublicKey,binanceSignTransaction',
        },
    ],
};

const legacyCanaryFirmware = {
    firmwares: ['2.2.0', '2-main'],
    tests: daily.tests,
};

const otherDevices = {
    firmwares: ['2-latest'],
    models: ['R', 'T3T1'],
    tests: [
        {
            name: 'api',
            pattern: 'authenticateDevice',
            methods: '',
            'web-environment': true,
            'node-environment': true,
        },
        {
            name: 'management',
            pattern: 'methods',
            'web-environment': false,
            'node-environment': true,
            methods: 'applySettings,applyFlags,getFirmwareHash',
        },
        {
            name: 'btc-others',
            pattern: 'methods',
            'web-environment': false,
            'node-environment': true,
            methods:
                'getAccountInfo,getAccountDescriptor,getPublicKey,signMessage,verifyMessage,composeTransaction,getOwnershipId,getOwnershipProof',
        },
        {
            name: 'stellar',
            pattern: 'methods',
            'web-environment': false,
            'node-environment': true,
            methods: 'stellarGetAddress,stellarSignTransaction',
        },
        {
            name: 'cardano',
            pattern: 'methods',
            'web-environment': false,
            'node-environment': true,
            methods:
                'cardanoGetAddress,cardanoGetNativeScriptHash,cardanoGetPublicKey,cardanoSignTransaction',
        },
        {
            name: 'ethereum',
            pattern: 'methods',
            'web-environment': false,
            'node-environment': true,
            methods:
                'ethereumGetAddress,ethereumGetPublicKey,ethereumSignMessage,ethereumSignTransaction,ethereumVerifyMessage,ethereumSignTypedData',
        },
        {
            name: 'ripple',
            pattern: 'methods',
            'web-environment': false,
            'node-environment': true,
            methods: 'rippleGetAddress,rippleSignTransaction',
        },
        {
            name: 'tezos',
            pattern: 'methods',
            'web-environment': false,
            'node-environment': true,
            methods: 'tezosGetAddress,tezosGetPublicKey,tezosSignTransaction',
        },
        {
            name: 'binance',
            pattern: 'methods',
            'web-environment': false,
            'node-environment': true,
            methods: 'binanceGetAddress,binanceGetPublicKey,binanceSignTransaction',
        },
    ],
};

const prepareTest = ({ firmwares, tests, models }) => {
    const withFirmwares = tests.flatMap(test => firmwares.map(firmware => ({ firmware, ...test })));

    if (models && models.length > 0) {
        return withFirmwares.flatMap(test => models.map(model => ({ model, ...test })));
    } else {
        return withFirmwares;
    }
};

const testData = {
    daily,
    otherDevices,
    legacyCanaryFirmware,
};

const args = process.argv.slice(2);
const [tests] = args;
const json = prepareTest(testData[tests]);

process.stdout.write(
    JSON.stringify({
        include: json,
    }),
);
