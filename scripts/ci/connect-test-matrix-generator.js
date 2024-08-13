const process = require('process');

const groups = {
    api: {
        name: 'api',
        pattern:
            'init authorizeCoinjoin cancelCoinjoinAuthorization passphrase unlockPath setBusy override checkFirmwareAuthenticity',
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
const daily = {
    firmwares: ['2-latest'],
    tests: [
        groups.api,
        groups.management,
        groups.btcSign,
        groups.btcOthers,
        groups.stellar,
        groups.cardano,
        groups.eos,
        groups.ethereum,
        groups.nem,
        groups.ripple,
        groups.tezos,
        groups.binance,
    ],
};

const legacyCanaryFirmware = {
    firmwares: ['2.3.0', '2-main'],
    tests: daily.tests
        // Cardano supports >=2.6.0
        .filter(test => test.name !== 'cardano'),
};

const otherDevices = {
    firmwares: ['2-latest'],
    models: ['R', 'T3T1'],
    tests: [
        // {
        //     ...groups.api,
        //     webEnvironment: true,
        //     nodeEnvironment: true,
        // },
        {
            ...groups.management,
            methods: groups.management.methods
                .split(',')
                // getFeatures test is not abstract enough to serve all models
                .filter(m => m !== 'getFeatures')
                .join(','),
            webEnvironment: false,
            nodeEnvironment: true,
        },
        // {
        //     ...groups.btcOthers,
        //     methods: groups.btcOthers.methods
        //         .split(',')
        //         // getAddress (decred) does not work for model R
        //         .filter(m => m !== 'getAddress')
        //         .join(','),
        //     webEnvironment: false,
        //     nodeEnvironment: true,
        // },
        // {
        //     ...groups.stellar,
        //     webEnvironment: false,
        //     nodeEnvironment: true,
        // },
        // {
        //     ...groups.cardano,
        //     webEnvironment: false,
        //     nodeEnvironment: true,
        // },
        // {
        //     ...groups.ethereum,
        //     webEnvironment: false,
        //     nodeEnvironment: true,
        // },
        // {
        //     ...groups.ripple,
        //     webEnvironment: false,
        //     nodeEnvironment: true,
        // },
        // {
        //     ...groups.tezos,
        //     webEnvironment: false,
        //     nodeEnvironment: true,
        // },
        // {
        //     ...groups.binance,
        //     webEnvironment: false,
        //     nodeEnvironment: true,
        // },
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
