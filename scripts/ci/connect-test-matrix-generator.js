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

const daily = {
    firmwares: ['2-latest'],
    tests: [...Object.values(groups)],
};

const legacyFirmware = {
    firmwares: ['2.3.0'],
    tests: daily.tests
        // Cardano supports >=2.6.0
        .filter(test => test.name !== 'cardano'),
};

const canaryFirmware = {
    firmwares: ['2-main'],
    tests: daily.tests,
};

const otherDevices = {
    firmwares: ['2-latest'],
    models: ['T2B1', 'T3T1'],
    tests: [
        ...Object.values(groups).filter(
            // management, btc-others are specified below
            // nem, eos are not supported anymore
            g => ['management', 'btc-others', 'nem', 'eos'].includes(g.name) === false,
        ),
        {
            ...groups.management,
            methods: groups.management.methods
                .split(',')
                // getFeatures test is not abstract enough to serve all models
                .filter(m => m !== 'getFeatures')
                .join(','),
        },
        {
            ...groups.btcOthers,
            methods: groups.btcOthers.methods
                .split(',')
                // getAddress (decred) does not work for model R
                .filter(m => m !== 'getAddress')
                .join(','),
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
    legacyFirmware,
    canaryFirmware,
    otherDevices,
};

const args = process.argv.slice(2);
const [tests] = args;
const json = prepareTest(testData[tests]);

process.stdout.write(
    JSON.stringify({
        include: json,
    }),
);
