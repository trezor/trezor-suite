// origin: https://github.com/trezor/connect/blob/develop/src/data/config.json

import { DeviceModelInternal } from '@trezor/device-utils';
import { TREZOR_USB_DESCRIPTORS } from '@trezor/transport/src/constants';

type Config = {
    webusb: typeof TREZOR_USB_DESCRIPTORS;
    whitelist: Array<{ origin: string; priority: number }>;
    management: Array<{ origin: string }>;
    onionDomains: Record<string, string>;
    supportedBrowsers: Record<
        string,
        {
            version: number;
            download: string;
            update: string;
        }
    >;
    supportedFirmware: Array<{
        coin?: string[]; // Todo: better type?
        capabilities?: string[]; // Todo: better type?
        methods?: string[]; // Todo: better type?
        min: Partial<Record<DeviceModelInternal, string>>;
        max?: undefined; // NOTE: max field is not used anywhere at the moment, it is here for type compatibility
        comment?: string[];
    }>;
};

export const config: Config = {
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
    onionDomains: {
        'trezor.io': 'trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion',
    },
    supportedBrowsers: {
        chrome: {
            version: 59,
            download: 'https://www.google.com/chrome/',
            update: 'https://support.google.com/chrome/answer/95414',
        },
        mobilechrome: {
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
        mobilefirefox: {
            version: 54,
            download: 'https://www.mozilla.org/en-US/firefox/new/',
            update: 'https://support.mozilla.org/en-US/kb/update-firefox-latest-version',
        },
        brave: {
            // Chromium based
            version: 59,
            download: 'https://brave.com/download/',
            update: 'https://brave.com/download/',
        },
        edge: {
            // Since version 79, Edge is based on Chromium
            version: 79,
            download: 'https://www.microsoft.com/en-us/edge',
            update: 'https://www.microsoft.com/en-us/edge',
        },
        opera: {
            // Chromium based
            version: 95,
            download: 'https://www.opera.com/download',
            update: 'https://www.opera.com/download',
        },
    },
    supportedFirmware: [
        {
            coin: ['xrp', 'txrp'],
            methods: ['getAccountInfo'],
            min: { T1B1: '0', T2T1: '2.1.0' },
            max: undefined, // NOTE: max field is not used anywhere at the moment, it is here for type compatibility
            comment: [
                "Since firmware 2.1.0 there is a new protobuf field 'destination_tag' in RippleSignTx",
            ],
        },
        {
            coin: ['bnb'],
            min: { T1B1: '1.9.0', T2T1: '2.3.0' },
            comment: [
                'There were protobuf backwards incompatible changes with introduction of 1.9.0/2.3.0 firmwares',
            ],
        },
        {
            coin: ['eth', 'tsep', 'thod'],
            min: { T1B1: '1.8.0', T2T1: '2.1.0' },
            comment: ['There were protobuf backwards incompatible changes.'],
        },
        {
            coin: ['ada', 'tada'],
            min: { T1B1: '0', T2T1: '2.4.3' },
            comment: ['Since 2.4.3 there is initialize.derive_cardano message'],
        },
        {
            methods: ['rippleGetAddress', 'rippleSignTransaction'],
            min: { T1B1: '0', T2T1: '2.1.0' },
            comment: [
                "Since firmware 2.1.0 there is a new protobuf field 'destination_tag' in RippleSignTx",
            ],
        },
        {
            methods: ['cardanoGetAddress', 'cardanoGetPublicKey'],
            min: { T1B1: '0', T2T1: '2.4.3' },
            comment: ['Since 2.4.3 Cardano derivation behavior has changed'],
        },
        {
            methods: ['cardanoSignTransaction'],
            min: { T1B1: '0', T2T1: '2.6.0' },
            comment: ['Before 2.6.0 not all Cardano transactions were supported'],
        },
        {
            methods: ['cardanoGetNativeScriptHash'],
            min: { T1B1: '0', T2T1: '2.4.3' },
            comment: ['Since 2.4.3 Cardano derivation behavior has changed'],
        },
        {
            methods: ['tezosSignTransaction'],
            min: { T1B1: '0', T2T1: '2.1.8' },
            comment: [
                'Since 2.1.8 there are new protobuf fields in tezos transaction (Babylon fork)',
            ],
        },
        {
            methods: ['stellarSignTransaction'],
            min: { T1B1: '1.9.0', T2T1: '2.3.0' },
            comment: [
                'There were protobuf backwards incompatible changes with introduction of 1.9.0/2.3.0 firmwares',
            ],
        },
        {
            capabilities: ['replaceTransaction', 'amountUnit'],
            min: { T1B1: '1.9.4', T2T1: '2.3.5' },
            comment: ['new sign tx process since 1.9.4/2.3.5'],
        },
        {
            capabilities: ['decreaseOutput'],
            min: { T1B1: '1.10.0', T2T1: '2.4.0' },
            comment: ['allow reduce output in RBF transaction since 1.10.0/2.4.0'],
        },
        {
            capabilities: ['eip1559'],
            min: { T1B1: '1.10.4', T2T1: '2.4.2' },
            comment: ['new eth transaction pricing mechanism (EIP1559) since 1.10.4/2.4.2'],
        },
        {
            capabilities: ['taproot', 'signMessageNoScriptType'],
            min: { T1B1: '1.10.4', T2T1: '2.4.3' },
            comment: [
                'new btc accounts taproot since 1.10.4/2.4.3 (BTC + TEST only)',
                'SignMessage with no_script_type support',
            ],
        },
        {
            coin: ['dcr', 'tdcr'],
            methods: ['signTransaction'],
            min: { T1B1: '1.10.1', T2T1: '2.4.0' },
            comment: [''],
        },
        {
            methods: ['ethereumSignTypedData'],
            min: { T1B1: '1.10.5', T2T1: '2.4.3' },
            comment: ['EIP-712 typed signing support added in 1.10.5/2.4.3'],
        },
        {
            capabilities: ['eip712-domain-only'],
            min: { T1B1: '1.10.6', T2T1: '2.4.4' },
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
            min: { T1B1: '1.12.1', T2T1: '2.5.3' },
        },
        {
            capabilities: ['tutorial'],
            methods: ['showDeviceTutorial'],
            min: {
                T1B1: '0',
                T2T1: '0',
                T3T1: '2.8.0',
            },
        },
        {
            methods: ['authenticateDevice'],
            min: {
                T1B1: '0',
                T2T1: '0',
                T3T1: '2.8.0',
            },
        },
        {
            capabilities: ['tropicDeviceAuthentication'],
            min: {
                // devices that don't support 'authenticateDevice' don't have to be listed here
                T2B1: '0',
                T3B1: '0',
                T3T1: '0',
                T3W1: '2.9.3',
            },
        },
        {
            capabilities: ['getFirmwareHash'],
            methods: ['getFirmwareHash'],
            min: { T1B1: '1.11.1', T2T1: '2.5.1' },
        },
        {
            methods: ['solanaGetPublicKey', 'solanaGetAddress', 'solanaSignTransaction'],
            min: {
                T1B1: '0',
                T2T1: '2.6.4',
                T2B1: '2.6.4',
            },
        },
        {
            capabilities: ['chunkify'],
            min: {
                T1B1: '0',
                T2T1: '2.6.3',
                T2B1: '2.6.3',
            },
            comment: [
                "Since firmware 2.6.3 there is a new protobuf field 'chunkify' in almost all getAddress and signTx methods",
            ],
        },
        {
            methods: ['changeLanguage'],
            min: {
                T1B1: '0',
                T2T1: '2.7.0',
                T2B1: '2.7.0',
            },
        },
        {
            capabilities: ['entropyCheck'],
            min: { T1B1: '1.13.1', T2T1: '2.8.7', T2B1: '2.8.7', T3B1: '2.8.7', T3T1: '2.8.7' },
        },
        {
            capabilities: ['evmApproval'],
            min: { T1B1: '0', T2T1: '2.9.0', T2B1: '2.9.0', T3B1: '2.9.0', T3T1: '2.9.0' },
            comment: ['EVM approval flow for ERC20 tokens, introduced in firmware 2.9.0'],
        },
        {
            capabilities: ['slip24'],
            methods: ['getNonce'],
            min: { T1B1: '0', T2T1: '2.9.1', T2B1: '2.9.1', T3B1: '2.9.1', T3T1: '2.9.1' },
            comment: ['Since firmware 2.9.1 SLIP-24 is supported'],
        },
        {
            methods: ['cardanoSignMessage'],
            min: { T1B1: '0', T2T1: '2.9.1', T2B1: '2.9.1', T3B1: '2.9.1', T3T1: '2.9.1' },
            comment: ['Cardano SignMessage call added in 2.9.1'],
        },
        {
            capabilities: ['evolu'],
            methods: [
                'evoluGetNode',
                'evoluSignRegistrationRequest',
                'evoluGetDelegatedIdentityKey',
            ],
            min: {
                T1B1: '0',
                T2T1: '0',
                T2B1: '2.10.0',
                T3B1: '2.10.0',
                T3T1: '2.10.0',
                T3W1: '2.10.0',
            },
        },
        {
            capabilities: ['monero'],
            methods: [
                'moneroGetAddress',
                'moneroGetWatchKey',
                'moneroKeyImageSync',
                'moneroSignTransaction',
            ],
            min: {
                T1B1: '0',
                T2T1: '2.5.3',
                T2B1: '2.5.3',
            },
        },
        {
            capabilities: ['telemetry'],
            methods: ['telemetryGet'],
            min: { T1B1: '0', T2T1: '2.10.1', T2B1: '2.10.1', T3B1: '2.10.1', T3T1: '2.10.1' },
            comment: ['Supported since 2.10.1'],
        },
    ],
};
