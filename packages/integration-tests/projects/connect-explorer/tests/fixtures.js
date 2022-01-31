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
        ],
    },
];

const getAddress = [
    {
        device: initializedDevice,
        url: 'getAddress',
        method: 'getAddress',
        views: [
            {
                selector: '.export-address >> visible=true',
                screenshot: {
                    name: 'export-address',
                },
                next: 'button.confirm >> visible=true',
            },
            {
                selector: 'text=3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX',
                screenshot: {
                    name: 'confirm-on-device',
                },
                nextEmu: {
                    type: 'emulator-press-yes',
                },
            },
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
                    type: 'select-num-of-words',
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

const fixtures = [
    ...getPublicKey,
    ...getAddress,
    ...getAccountInfo,
    ...composeTransaction,
    ...signTransaction,
    ...signMessage,
    ...verifyMessage,
    ...wipeDevice,
    ...resetDevice,
    ...recoverDevice,
];

module.exports = fixtures;
