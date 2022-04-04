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

const confirmExportAddressScreen = {
    selector: '.export-address >> visible=true',
    screenshot: {
        name: 'export-address',
    },
    next: 'button.confirm >> visible=true',
};

const getConfirmAddressOnDeviceScreen = address => ({
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
        method: 'getPublicKey',
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
        method: 'getAddress',
        views: [
            confirmExportAddressScreen,
            getConfirmAddressOnDeviceScreen('3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX'),
        ],
    },
];

const getAccountInfo = [
    {
        device: initializedDevice,
        url: 'getAccountInfo',
        method: 'getAccountInfo',
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
        method: 'getAccountInfo',
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
        device: initializedDevice,
        url: 'composeTransaction',
        method: 'composeTransaction',
        views: [
            {
                selector: '.select-account.p2sh',
                screenshot: {
                    name: 'select-account',
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
            {
                action: 'close',
            },
            // todo: fee list. requires actual coins
        ],
    },
];

const signTransaction = [
    {
        device: initializedDevice,
        url: 'signTransaction-paytoaddress',
        method: 'signTransaction-paytoaddress',
        views: [
            {
                selector: '.confirm-output >> visible=true',
                screenshot: {
                    name: 'confirm-output-on-device',
                },
                nextEmu: {
                    type: 'emulator-press-yes',
                },
            },
            followDevice,
        ],
    },
];

const signMessage = [
    {
        url: 'signMessage',
        method: 'signMessage',
        device: initializedDevice,
        views: [
            {
                selector: '.info-panel', // does not have a special screen
                screenshot: {
                    name: 'sign-message',
                },
                nextEmu: {
                    type: 'emulator-press-yes',
                },
            },
            {
                selector: '.info-panel',
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
        method: 'verifyMessage',
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
        method: 'wipeDevice',
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

const resetDevice = [
    {
        url: 'resetDevice',
        method: 'resetDevice',
        device: {
            wiped: true,
        },
        views: [
            {
                selector: '.device-management >> visible=true',
                screenshot: {
                    name: 'reset-device',
                },
                next: 'button.confirm >> visible=true',
            },
            followDevice,
        ],
    },
];

const recoverDevice = [
    {
        url: 'recoverDevice',
        method: 'recoveryDevice',
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
                    name: 'follow-device-confirm-select-number-of-words',
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

const ethereumSignMessage = [
    {
        ...signMessage[0],
        url: 'ethereumSignMessage',
        method: 'ethereumSignMessage',
    },
];

const ethereumVerifyMessage = [
    {
        ...verifyMessage[0],
        url: 'ethereumVerifyMessage',
        method: 'ethereumVerifyMessage',
    },
];

const ethereumSignTypedData = [
    {
        url: 'ethereumSignTypedData',
        method: 'ethereumSignTypedData',
        device: initializedDevice,
        views: [
            {
                selector: '.info-panel',
                screenshot: {
                    name: 'sign-message',
                },
                nextEmu: {
                    type: 'emulator-press-yes',
                },
            },
            {
                selector: '.info-panel',
                screenshot: {
                    name: 'sign-message',
                },
                nextEmu: {
                    type: 'emulator-press-yes',
                },
            },
            {
                selector: '.info-panel',
                nextEmu: {
                    type: 'emulator-press-yes',
                },
            },
        ],
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

const eosGetPublicKey = [
    {
        ...getPublicKey[0],
        url: 'eosGetPublicKey',
        views: [confirmExportAddressScreen, followDevice],
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

const fixtures = [
    ...getPublicKey,
    ...getAddress,
    ...getAccountInfo,
    // todo: waiting for selector "text=Not enough funds >> visible=true" to be visible
    // maybe somebody sent money there?
    // ...composeTransaction,
    ...signTransaction,
    ...signMessage,
    ...verifyMessage,
    ...wipeDevice,
    ...recoverDevice,
    // todo: resetDevice also breaks next test in queue and is flaky itself
    // ...resetDevice,
    ...ethereumGetPublicKey,
    ...ethereumGetAddress,
    ...ethereumSignMessage,
    ...ethereumVerifyMessage,
    ...ethereumSignTypedData,
    ...cardanoGetPublicKey,
    ...cardanoGetAddress,
    ...cardanoGetNativeScriptHash,
    ...tezosGetPublicKey,
    ...tezosGetAddress,
    ...eosGetPublicKey,
    ...binanceGetPublicKey,
    ...binanceGetAddress,
    ...stellarGetAddress,
    ...rippleGetAddress,
    ...nemGetAddress,
];

module.exports = fixtures;
