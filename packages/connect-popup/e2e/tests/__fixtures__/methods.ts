const initializedDevice = {
    // some random empty seed. most of the test don't need any account history so it is better not to slow them down with all all seed
    mnemonic: 'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
    pin: '',
    passphrase_protection: false,
    label: 'My Trevor',
    needs_backup: false,
};

const followDevice = {
    selector: '.follow-device >> visible=true',
    screenshot: {
        name: 'confirm-on-device',
    },
    nextEmu: {
        type: 'emulator-press-yes',
    },
};

const confirmOutput = {
    selector: '.confirm-output >> visible=true',
    screenshot: {
        name: 'confirm-output-on-device',
    },
    nextEmu: {
        type: 'emulator-press-yes',
    },
};

const confirmExportAddressScreen = {
    selector: '.export-address >> visible=true',
    screenshot: {
        name: 'export-address',
    },
    next: 'button.confirm >> visible=true',
};

const getConfirmAddressOnDeviceScreen = (address: string) => ({
    selector: `text=${address}`,
    screenshot: {
        name: 'confirm-on-device',
    },
    nextEmu: {
        type: 'emulator-press-yes',
    },
});

// todo: method field is not used anywhere at the moment;

const getPublicKey = [
    {
        device: initializedDevice,
        url: 'getPublicKey',
        view: 'export-xpub',
        views: [
            {
                selector: '.export-xpub >> visible=true',
                screenshot: {
                    name: 'export-xpub',
                },
                next: 'button.confirm >> visible=true',
            },
            followDevice,
        ],
    },
];

const getAddress = [
    {
        device: initializedDevice,
        url: 'getAddress',
        views: [
            confirmExportAddressScreen,
            getConfirmAddressOnDeviceScreen('3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX'),
        ],
    },
    {
        title: 'getAddress with passphrase',
        device: { ...initializedDevice, passphrase_protection: true },
        url: 'getAddress',
        views: [
            confirmExportAddressScreen,
            {
                selector: '[data-test-id="@passphrase/enter-on-device-button"]',
                screenshot: {
                    name: 'passhprase-screen',
                },
                next: '[data-test-id="@passphrase/enter-on-device-button"]',
            },
            {
                selector: '.passphrase-on-device >> visible=true',
                screenshot: {
                    name: 'passhprase-screen-enter-on-device',
                },
                nextEmu: {
                    type: 'emulator-input',
                    value: 'meow',
                },
            },
            getConfirmAddressOnDeviceScreen('387JG5Bfs2unbUYEuya7t47dMNchWvKtoj'),
        ],
    },
];

const getAccountInfo = [
    {
        device: initializedDevice,
        url: 'getAccountInfo',
        views: [
            {
                selector: '.export-account-info >> visible=true',
                screenshot: {
                    name: 'get-account-info',
                },
                next: 'button.confirm >> visible=true',
            },
        ],
    },
    {
        device: initializedDevice,
        url: 'getAccountInfo-xpub',
        views: [
            {
                selector: '.export-account-info >> visible=true',
                screenshot: {
                    name: 'get-account-info',
                },
                next: 'button.confirm >> visible=true',
            },
            {
                selector: 'text=Account #1 >> visible=true',
                screenshot: {
                    name: 'select-account',
                },
                next: 'text=Account #1 >> visible=true',
            },
        ],
    },
];

const composeTransaction = [
    {
        device: {
            ...initializedDevice,
            mnemonic:
                'upgrade lesson quit mule level either mobile any evidence melody obvious ancient',
        },
        url: 'composeTransaction',
        views: [
            {
                selector: '.tabs>.tab-selection.p2wpkh >> visible=true',
                screenshot: {
                    name: 'select-account-segwit',
                },
                next: '.tabs>.tab-selection.p2wpkh >> visible=true',
            },
            {
                selector: '.select-account.p2wpkh >> visible=true',
                screenshot: {
                    name: 'select-account-segwit-native',
                },
                next: 'text=0 TEST >> visible=true',
            },
            {
                selector: 'text=Not enough funds >> visible=true',
                screenshot: {
                    name: 'not enough funds',
                },
                next: undefined,
            },
            // not enough funds returns user to the default account which is segwit
            // so we need to navigate to segwit-native again
            {
                selector: '.tabs>.tab-selection.p2wpkh >> visible=true',
                next: '.tabs>.tab-selection.p2wpkh >> visible=true',
            },
            {
                selector: '.select-account.p2wpkh >> visible=true',
                // this account should have positive balance
                next: 'text=Account #2 >> visible=true',
            },
            {
                selector: 'text=Select fee >> visible=true',
                screenshot: {
                    name: 'select-fee-default-screen',
                },
                next: '.custom-fee >> visible=true',
            },
            {
                selector: '.send-button >> visible=true',
                screenshot: {
                    name: 'select-fee-custom-fee-screen',
                },
                next: '.send-button >> visible=true',
            },
            confirmOutput,
            confirmOutput,
            followDevice,
        ],
    },
];

const signTransaction = [
    {
        device: initializedDevice,
        url: 'signTransaction-paytoaddress',
        views: [
            confirmOutput,
            confirmOutput,
            followDevice,
            followDevice, // will end with Failure_DataError, inputs do not belong to this seed
        ],
    },
];

const ethereumSignTransaction = [
    {
        device: initializedDevice,
        url: 'ethereumSignTransaction',
        views: [followDevice, followDevice, followDevice],
    },
];

const signMessage = [
    {
        url: 'signMessage',
        device: initializedDevice,
        views: [
            {
                selector: '[data-test-id="@info-panel"]', // does not have a special screen
                screenshot: {
                    name: 'sign-message',
                },
                nextEmu: {
                    type: 'emulator-press-yes',
                },
            },
            {
                selector: '[data-test-id="@info-panel"]',
                nextEmu: {
                    type: 'emulator-press-yes',
                },
            },
        ],
    },
];

const verifyMessage = [
    {
        url: 'verifyMessage',
        device: initializedDevice,
        views: [
            {
                selector: '.follow-device >> visible=true',
                screenshot: {
                    name: 'verify-message',
                },
                nextEmu: {
                    type: 'emulator-press-yes',
                },
            },
            {
                selector: '.follow-device >> visible=true',
                screenshot: {
                    name: 'verify-message',
                },
                nextEmu: {
                    type: 'emulator-press-yes',
                },
            },
            {
                selector: '.follow-device >> visible=true',
                screenshot: {
                    name: 'verify-message',
                },
                nextEmu: {
                    type: 'emulator-press-yes',
                },
            },
        ],
    },
];

const wipeDevice = [
    {
        url: 'wipeDevice',
        device: initializedDevice,
        views: [
            {
                selector: '.device-management >> visible=true',
                screenshot: {
                    name: 'wipe-device',
                },
                next: 'button.confirm >> visible=true',
            },
            followDevice,
        ],
    },
];

// const resetDevice = [
//     {
//         url: 'resetDevice',
//         device: {
//             wiped: true,
//         },
//         views: [
//             {
//                 selector: '.device-management >> visible=true',
//                 screenshot: {
//                     name: 'reset-device',
//                 },
//                 next: 'button.confirm >> visible=true',
//             },
//             followDevice,
//         ],
//     },
// ];

const recoverDevice = [
    {
        url: 'recoverDevice',
        device: {
            wiped: true,
        },
        views: [
            {
                selector: '.device-management >> visible=true',
                screenshot: {
                    name: 'recover-device',
                },
                next: 'button.confirm >> visible=true',
            },
            {
                selector: '.follow-device >> visible=true',
                screenshot: {
                    name: 'follow-device-confirm-recovery',
                },
                nextEmu: {
                    type: 'emulator-press-yes',
                },
            },
            {
                selector: '.follow-device >> visible=true',
                screenshot: {
                    name: 'follow-device-select-number-of-words',
                },
                nextEmu: {
                    type: 'emulator-select-num-of-words',
                    num: 12,
                },
            },
            {
                selector: '.follow-device >> visible=true',
                screenshot: {
                    name: 'follow-device-enter-seed',
                },
                nextEmu: {
                    type: 'emulator-press-yes',
                },
            },
            ...Array(12).fill({
                selector: '.follow-device >> visible=true',
                screenshot: {
                    name: 'follow-device-enter-seed',
                },
                nextEmu: {
                    type: 'emulator-input',
                    value: 'all',
                },
            }),
            {
                selector: '.follow-device >> visible=true',
                screenshot: {
                    name: 'follow-device-success',
                },
                nextEmu: {
                    type: 'emulator-press-yes',
                },
            },
        ],
    },
];

const ethereumGetPublicKey = [
    {
        ...getPublicKey[0],
        url: 'ethereumGetPublicKey',
    },
];

const ethereumGetAddress = [
    {
        ...getAddress[0],
        url: 'ethereumGetAddress',
        views: [
            confirmExportAddressScreen,
            getConfirmAddressOnDeviceScreen('0x3f2329C9ADFbcCd9A84f52c906E936A42dA18CB8'),
        ],
    },
];

const ethereumGetAddressGoChain = [
    {
        ...getAddress[0],
        url: 'ethereumGetAddress-gochain',
        views: [
            {
                // Tests that definition was correctly loaded, decoded and displayed in the "main section of screen"
                selector: 'text=Export GoChain address',
                screenshot: {
                    name: 'export-address-go-chain',
                },
                next: 'button.confirm >> visible=true',
            },
            getConfirmAddressOnDeviceScreen('0x2cfd36BE875fd9cF203Ad1BD90C96e085a7839DB'),
        ],
    },
];

const ethereumSignMessage = [
    {
        ...signMessage[0],
        url: 'ethereumSignMessage',
    },
];

const ethereumVerifyMessage = [
    {
        ...verifyMessage[0],
        url: 'ethereumVerifyMessage',
    },
];

const ethereumSignTypedData = [
    {
        url: 'ethereumSignTypedData',
        device: initializedDevice,
        views: [followDevice, followDevice, followDevice, followDevice],
    },
];

const cardanoGetPublicKey = [
    {
        ...getPublicKey[0],
        url: 'cardanoGetPublicKey',
    },
];

const cardanoGetAddress = [
    {
        ...getAddress[0],
        url: 'cardanoGetAddress',
        views: [
            confirmExportAddressScreen,
            getConfirmAddressOnDeviceScreen(
                'addr1q9hsv6vspp4l3nvmqzw529teq2ha08s0fgjvzghzh628uccfey0wtrgp5rmxvld7khc745x9mk7gts5ctuzerlf4edrqhtk02t',
            ),
        ],
    },
];

const cardanoSignTransaction = [
    {
        device: initializedDevice,
        url: 'cardanoSignTransaction',
        views: [followDevice, followDevice, followDevice, followDevice],
    },
];

const cardanoGetNativeScriptHash = [
    {
        url: 'cardanoGetNativeScriptHash',
        device: initializedDevice,
        views: [followDevice, followDevice],
    },
];

const tezosGetPublicKey = [
    {
        ...getAddress[0],
        url: 'tezosGetPublicKey',
        views: [confirmExportAddressScreen, followDevice],
    },
];

const tezosGetAddress = [
    {
        ...getAddress[0],
        url: 'tezosGetAddress',
        views: [
            confirmExportAddressScreen,
            getConfirmAddressOnDeviceScreen('tz1ckrgqGGGBt4jGDmwFhtXc1LNpZJUnA9F2'),
        ],
    },
];

const tezosSignTransaction = [
    {
        device: initializedDevice,
        url: 'tezosSignTransaction',
        views: [followDevice, followDevice, followDevice],
    },
];

const eosGetPublicKey = [
    {
        ...getPublicKey[0],
        url: 'eosGetPublicKey',
        views: [confirmExportAddressScreen, followDevice],
    },
];

const eosSignTransaction = [
    {
        device: initializedDevice,
        url: 'eosSignTransaction',
        views: [followDevice, followDevice],
    },
];

const binanceGetPublicKey = [
    {
        ...getPublicKey[0],
        url: 'binanceGetPublicKey',
        views: [confirmExportAddressScreen, followDevice],
    },
];

const binanceGetAddress = [
    {
        ...getAddress[0],
        url: 'binanceGetAddress',
        views: [
            confirmExportAddressScreen,
            getConfirmAddressOnDeviceScreen('bnb1afwh46v6nn30nkmugw5swdmsyjmlxslgjfugre'),
        ],
    },
];

const binanceSignTransaction = [
    {
        device: initializedDevice,
        url: 'binanceSignTransaction-transfer',
        views: [confirmOutput, confirmOutput, confirmOutput, confirmOutput],
    },
];

const stellarGetAddress = [
    {
        ...getAddress[0],
        url: 'stellarGetAddress',
        views: [
            confirmExportAddressScreen,
            getConfirmAddressOnDeviceScreen(
                'GAK5MSF74TJW6GLM7NLTL76YZJKM2S4CGP3UH4REJHPHZ4YBZW2GSBPW',
            ),
        ],
    },
];

// todo: start using this fixture
// const stellarSignTransaction = [
//     {
//         device: initializedDevice,
//         url: 'stellarSignTransaction',
//         views: [followDevice, followDevice],
//     },
// ];

const rippleGetAddress = [
    {
        ...getAddress[0],
        url: 'rippleGetAddress',
        views: [
            confirmExportAddressScreen,
            getConfirmAddressOnDeviceScreen('rh5ZnEVySAy7oGd3nebT3wrohGDrsNS83E'),
        ],
    },
];

const rippleSignTransaction = [
    {
        device: initializedDevice,
        url: 'rippleSignTransaction',
        views: [confirmOutput, confirmOutput, followDevice],
    },
];

const nemGetAddress = [
    {
        ...getAddress[0],
        url: 'nemGetAddress',
        views: [
            confirmExportAddressScreen,
            getConfirmAddressOnDeviceScreen('ND7FI2VK7ZRCPDRUII62XL567V72IPO5CALURY6D'),
        ],
    },
];

const nemSignTransaction = [
    {
        device: initializedDevice,
        url: 'nemSignTransaction',
        views: [confirmOutput, confirmOutput, confirmOutput, followDevice],
    },
];

const cipherKeyValue = [
    {
        url: 'cipherKeyValue',
        device: initializedDevice,
        views: [followDevice],
    },
];

export const fixtures = [
    ...getPublicKey,
    ...getAddress,
    ...getAccountInfo,
    ...signMessage,
    ...signTransaction,
    ...verifyMessage,
    ...recoverDevice,
    ...ethereumGetPublicKey,
    ...ethereumGetAddress,
    ...ethereumGetAddressGoChain,
    ...ethereumSignTransaction,
    ...ethereumSignMessage,
    ...ethereumVerifyMessage,
    ...ethereumSignTypedData,
    ...cardanoGetPublicKey,
    ...cardanoGetAddress,
    ...cardanoSignTransaction,
    ...cardanoGetNativeScriptHash,
    ...tezosGetPublicKey,
    ...tezosGetAddress,
    ...tezosSignTransaction,
    ...eosGetPublicKey,
    ...eosSignTransaction,
    ...binanceGetPublicKey,
    ...binanceGetAddress,
    ...binanceSignTransaction,
    ...stellarGetAddress,
    // todo: error in params. probably we should implement @trezor/connect-stellar-plugin
    // ...stellarSignTransaction,
    ...rippleGetAddress,
    ...rippleSignTransaction,
    ...nemGetAddress,
    ...nemSignTransaction,
    ...cipherKeyValue,
    // balance dependent tests
    // these are using masked seed in gitlab CI
    ...composeTransaction,
    // todo:
    // management methods
    // note that it is not so important to test these as they are not available to 3rd party
    ...wipeDevice,
    // todo: resetDevice also breaks next test in queue and is flaky itself
    // ...resetDevice,
    // todo: missing
    // firmwareUpdate
    // backupDevice
];
