// origin: https://github.com/trezor/connect/blob/develop/src/data/config.json

import { TREZOR_USB_DESCRIPTORS } from '@trezor/transport/lib/constants';

export const config = {
    webusb: TREZOR_USB_DESCRIPTORS,
    whitelist: [
        { origin: 'chrome-extension://imloifkgjagghnncjkhggdhalmcnfklk', priority: 1 },
        { origin: 'chrome-extension://niebkpllfhmpfbffbfifagfgoamhpflf', priority: 1 },
        { origin: 'file://', priority: 2 },
        { origin: 'trezor.io', priority: 0 },
        { origin: 'sldev.cz', priority: 0 },
        { origin: 'localhost', priority: 0 },
        { origin: 'trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion', priority: 0 },
    ],
    management: [{ origin: 'trezor.io' }, { origin: 'sldev.cz' }, { origin: 'localhost' }],
    knownHosts: [
        {
            origin: 'imloifkgjagghnncjkhggdhalmcnfklk',
            label: 'Trezor Password Manager (Develop)',
            icon: '',
        },
        { origin: 'niebkpllfhmpfbffbfifagfgoamhpflf', label: 'Trezor Password Manager', icon: '' },
        { origin: 'trezor-connect@trezor.io', label: 'Trezor Connect FF Extension', icon: '' },
        {
            origin: 'efbfhenfhihgdcmnfdkhaphjdnopihlf',
            label: 'Trezor Connect Chrome Extension',
            icon: '',
        },
        {
            origin: 'mnpfhpndmjholfdlhpkjfmjkgppmodaf',
            label: 'MetaMask',
            icon: '',
        },
        {
            origin: 'webextension@metamask.io',
            label: 'MetaMask',
            icon: '',
        },
        { origin: 'file://', label: ' ', icon: '' },
    ],
    onionDomains: {
        'trezor.io': 'trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion',
    },
    assets: [
        {
            name: 'coins',
            url: './data/coins.json',
        },
        {
            name: 'coinsEth',
            url: './data/coins-eth.json',
        },
        {
            name: 'bridge',
            url: './data/bridge/releases.json',
        },
        {
            name: 'firmware-t1',
            url: './data/firmware/1/releases.json',
        },
        {
            name: 'firmware-t2',
            url: './data/firmware/2/releases.json',
        },
    ],
    messages: './data/messages/messages.json',
    supportedBrowsers: {
        chrome: {
            version: 59,
            download: 'https://www.google.com/chrome/',
            update: 'https://support.google.com/chrome/answer/95414',
        },
        chromium: {
            version: 59,
            download: 'https://www.chromium.org/',
            update: 'https://www.chromium.org/',
        },
        electron: {
            version: 0,
            download: 'https://www.electronjs.org/',
            update: 'https://www.electronjs.org/',
        },
        firefox: {
            version: 54,
            download: 'https://www.mozilla.org/en-US/firefox/new/',
            update: 'https://support.mozilla.org/en-US/kb/update-firefox-latest-version',
        },
    },
    supportedFirmware: [
        {
            coin: ['xrp', 'txrp'],
            methods: ['getAccountInfo'],
            min: ['0', '2.1.0'],
            max: undefined, // NOTE: max field is not used anywhere at the moment, it is here for type compatibility
            comment: [
                "Since firmware 2.1.0 there is a new protobuf field 'destination_tag' in RippleSignTx",
            ],
        },
        {
            coin: ['bnb'],
            min: ['1.9.0', '2.3.0'],
            comment: [
                'There were protobuf backwards incompatible changes with introduction of 1.9.0/2.3.0 firmwares',
            ],
        },
        {
            coin: ['eth', 'tsep', 'tgor'],
            min: ['1.8.0', '2.1.0'],
            comment: ['There were protobuf backwards incompatible changes.'],
        },
        {
            methods: ['rippleGetAddress', 'rippleSignTransaction'],
            min: ['0', '2.1.0'],
            comment: [
                "Since firmware 2.1.0 there is a new protobuf field 'destination_tag' in RippleSignTx",
            ],
        },
        {
            methods: ['cardanoGetAddress', 'cardanoGetPublicKey'],
            min: ['0', '2.3.2'],
            comment: ['Shelley fork support since firmware 2.3.2'],
        },
        {
            methods: ['cardanoSignTransaction'],
            min: ['0', '2.4.2'],
            comment: ['Non-streamed signing no longer supported'],
        },
        {
            methods: ['cardanoGetNativeScriptHash'],
            min: ['0', '2.4.3'],
            comment: ['Cardano GetNativeScriptHash call added in 2.4.3'],
        },
        {
            methods: ['tezosSignTransaction'],
            min: ['0', '2.1.8'],
            comment: [
                'Since 2.1.8 there are new protobuf fields in tezos transaction (Babylon fork)',
            ],
        },
        {
            methods: ['stellarSignTransaction'],
            min: ['1.9.0', '2.3.0'],
            comment: [
                'There were protobuf backwards incompatible changes with introduction of 1.9.0/2.3.0 firmwares',
            ],
        },
        {
            capabilities: ['replaceTransaction', 'amountUnit'],
            min: ['1.9.4', '2.3.5'],
            comment: ['new sign tx process since 1.9.4/2.3.5'],
        },
        {
            capabilities: ['decreaseOutput'],
            min: ['1.10.0', '2.4.0'],
            comment: ['allow reduce output in RBF transaction since 1.10.0/2.4.0'],
        },
        {
            capabilities: ['eip1559'],
            min: ['1.10.4', '2.4.2'],
            comment: ['new eth transaction pricing mechanism (EIP1559) since 1.10.4/2.4.2'],
        },
        {
            capabilities: ['taproot', 'signMessageNoScriptType'],
            min: ['1.10.4', '2.4.3'],
            comment: [
                'new btc accounts taproot since 1.10.4/2.4.3 (BTC + TEST only)',
                'SignMessage with no_script_type support',
            ],
        },
        {
            coin: ['dcr', 'tdcr'],
            methods: ['signTransaction'],
            min: ['1.10.1', '2.4.0'],
            comment: [''],
        },
        {
            methods: ['ethereumSignTypedData'],
            min: ['1.10.5', '2.4.3'],
            comment: ['EIP-712 typed signing support added in 1.10.5/2.4.3'],
        },
        {
            capabilities: ['eip712-domain-only'],
            min: ['1.10.6', '2.4.4'],
            comment: ['EIP-712 domain-only signing, when primaryType=EIP712Domain'],
        },
        {
            capabilities: ['coinjoin'],
            methods: [
                'authorizeCoinjoin',
                'cancelCoinjoinAuthorization',
                'getOwnershipId',
                'getOwnershipProof',
                'setBusy',
                'unlockPath',
            ],
            min: ['1.12.1', '2.5.3'],
        },
        {
            methods: ['showDeviceTutorial'],
            min: ['0', '2.6.1'],
            comment: ['Only on T2B1'],
        },
        {
            methods: ['solanaGetPublicKey', 'solanaGetAddress', 'solanaSignTransaction'],
            // TODO (vl/connect): increase version
            min: ['0', '2.6.1.'],
            comment: ['Only on T2B1'],
        },
    ],
};
