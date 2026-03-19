import fs from 'fs';
import path from 'path';

import TrezorConnect, {
    type Device,
    ThpPairingMethod,
    type UiRequestThpPairing,
} from '@trezor/connect';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Psbt, address as bitcoinJsAddress } from '@trezor/utxo-lib';

import { HELP, args } from './args';
import { stdioManager } from './stdio';
import {
    debugLinkDecision,
    debugLinkState,
    getTransport,
    initDebugLink,
    isDebugLinkInteraction,
} from './transport';

/* eslint-disable no-console */

const waitForStdio = stdioManager();

const waitForPairingTag = async (uiEvent: UiRequestThpPairing) => {
    const { selectedMethod } = uiEvent.payload;
    if (!isDebugLinkInteraction('pairing')) {
        const resp = await waitForStdio('Enter pairing code or type [C] for Cancel:').promise;
        if (resp === 'c') {
            return;
        }

        return resp;
    } else {
        const state = await debugLinkState(uiEvent.payload);
        if (!state?.success) {
            throw new Error('DebugLinkState missing: ' + state.error);
        }
        const { payload } = state;
        if (payload.type !== 'DebugLinkPairingInfo') {
            throw new Error(
                'DebugLinkState missing, received ' + state.payload.type,
                // state.payload.message,
            );
        }
        const { code_entry_code, code_qr_code, nfc_secret_trezor } = payload.message;
        if (selectedMethod === ThpPairingMethod.CodeEntry && code_entry_code) {
            return Number(code_entry_code).toString().padStart(6, '0');
        }
        if (selectedMethod === ThpPairingMethod.QrCode && code_qr_code) {
            // NOTE: qrcode throws from firmware: Pairing tag cancelled (Failure) ?
            return code_qr_code;
        }
        if (selectedMethod === ThpPairingMethod.NFC && nfc_secret_trezor) {
            return nfc_secret_trezor;
        }

        return 'unknown-tag';
    }
};

const cliStatePath = path.join(__dirname, 'thp-state.dat');
const readCliState = (): { credentials: NonNullable<Device['thp']>['credentials'] } => {
    try {
        return JSON.parse(fs.readFileSync(cliStatePath, 'utf8'));
    } catch {
        return { credentials: [] };
    }
};

const writeCliState = (data: any) => {
    fs.writeFileSync(cliStatePath, JSON.stringify(data, null, 2), 'utf8');
};

const getThpCredentials = () => {
    const data = readCliState();
    if (args.credentials) {
        return data.credentials.filter(c => !c.autoconnect);
    }
    if (args.autoconnect) {
        return data.credentials;
    }

    return [];
};

const getFeatures = (device: Device) =>
    TrezorConnect.getFeatures({
        device,
    });

const BITCOIN_COMPOSE_ACCOUNT = {
    path: "m/84'/0'/0'",
    addresses: {
        used: [
            {
                address: 'bc1qannfxke2tfd4l7vhepehpvt05y83v3qsf6nfkk',
                path: "m/84'/0'/0'/0/0",
                transfers: 1,
                balance: '9426',
                sent: '0',
                received: '9426',
            },
        ],
        unused: [],
        change: [
            {
                address: 'bc1qktmhrsmsenepnnfst8x6j27l0uqv7ggrg8x38q',
                path: "m/84'/0'/0'/1/0",
                transfers: 0,
                balance: '0',
                sent: '0',
                received: '0',
            },
        ],
    },
    utxo: [
        {
            txid: '799a8923515e0303b15dda074b8341b2cf5efab946fce0d68a6614f32a8fc935',
            vout: 0,
            amount: '30000',
            blockHeight: 678101,
            address: 'bc1qannfxke2tfd4l7vhepehpvt05y83v3qsf6nfkk',
            path: "m/84'/0'/0'/0/0",
            confirmations: 100,
        },
        {
            txid: 'a41342ea303735195d206fcc8559cff682d9f4859fb91ebfda45ba5abb0ce3b9',
            vout: 1,
            amount: '56000',
            blockHeight: 714458,
            address: 'bc1qannfxke2tfd4l7vhepehpvt05y83v3qsf6nfkk',
            path: "m/84'/0'/0'/0/0",
            confirmations: 100,
        },
    ],
};

const composeTx = async (device: Device) => {
    console.warn('Composing Bitcoin transaction from PSBT fixture', {
        accountPath: BITCOIN_COMPOSE_ACCOUNT.path,
        utxoCount: BITCOIN_COMPOSE_ACCOUNT.utxo.length,
        fixtureVariant: 'changeFromAddress',
    });

    const psbt = Psbt.fromHex(
        '70736274ff0100eb02000000010b3f321c502c38a35a4d9dbcb191d7eea8ceec7369b0ea56cc112db46fccdd2e0100000000fdffffff04f7260000000000001976a914ca5f92656fbe1821cab58c0a7e3e36c64cfc6d7b88ac00000000000000004f6a4c4c3078336238376531633835353236333836326361303461663965646538373163653165626562373166646434663166306431636435643164643130356430306338303d7c6c69666981afa45493600d0000000000160014db426b8ba3f986442d9f30ed6fbf2047202b080d26010000000000001600149ab105ce5f65cc9d3e51e4b2403eef1831eb5bfd000000000001011f1a8b0d0000000000160014db426b8ba3f986442d9f30ed6fbf2047202b080d0000000000',
    );

    psbt.unsignedTx.outs[2].value = '1';
    psbt.unsignedTx.outs[2].script = bitcoinJsAddress.toOutputScript(
        'bc1qannfxke2tfd4l7vhepehpvt05y83v3qsf6nfkk',
    );

    const composed = await TrezorConnect.composeTransaction({
        account: BITCOIN_COMPOSE_ACCOUNT,
        outputs: [],
        psbtTransactionData: psbt.toHex(),
        coin: 'btc',
        feeLevels: [{ feePerUnit: '1' }],
        sortingStrategy: 'none',
    });

    if (!composed.success) {
        return composed;
    }

    const selectedResult = composed.payload[0];
    if (!selectedResult || selectedResult.type === 'error') {
        return composed;
    }

    if (selectedResult.type !== 'final') {
        return composed;
    }

    return TrezorConnect.signTransaction({
        device,
        inputs: selectedResult.inputs,
        outputs: selectedResult.outputs,
        coin: 'btc',
    });
};

const fwUpdate = (device: Device) =>
    TrezorConnect.firmwareUpdate({
        device,
        baseUrl: path.resolve(__dirname, '../connect-data/files'),
    });

const runTestCase = async (device: Device) => {
    const { method } = args;
    if (method === 'none') {
        console.log('Missing method. Exiting');
        process.exit(1);
    }

    const params = args.params ? JSON.parse(args.params) : {};

    let result;
    switch (method) {
        case 'fw-update':
            result = await fwUpdate(device);
            break;
        case 'compose-tx':
            result = await composeTx(device);
            break;
        case 'get-credentials':
            result = await TrezorConnect.thpGetCredentials({ device });
            break;
        case 'get-account-info':
            result = await TrezorConnect.getAccountInfo({
                device,
                coin: 'btc',
                path: "m/84'/0'/0'",
                ...params,
            });
            break;
        case 'get-account-descriptor':
            result = await TrezorConnect.getAccountDescriptor({
                device,
                coin: 'btc',
                path: "m/84'/0'/0'",
                ...params,
            });
            break;
        case 'get-features':
            result = await TrezorConnect.getFeatures({ device, ...params });
            break;
        case 'apply-settings':
            result = await TrezorConnect.applySettings({ device, ...params });
            break;
        default:
            result = await TrezorConnect.getAddress({ device, path: "m/44'/0'/0'/0/0", ...params });
    }

    console.warn(result);
    process.exit(1);
};

const run = async () => {
    if (args.help || args.h) {
        console.log(HELP);

        return;
    }

    let testIsRunning = false;

    console.log('Running @trezor/connect CLI with args', args);

    TrezorConnect.on('DEVICE_EVENT', async event => {
        if (event.type === 'device-connect_unacquired' || event.type === 'device-connect') {
            if (testIsRunning) {
                return;
            }

            const device = event.payload;
            if (device.features && device.mode === 'initialize') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                await TrezorConnect.loadDevice({
                    device,
                    pin: '',
                    label: 'THP device',
                    passphrase_protection: true,
                    mnemonics: ['all all all all all all all all all all all all'],
                    skip_checksum: true,
                });
            }

            if (!device.features && device.thp?.properties) {
                // start pairing
                const result = await getFeatures(device);
                if (!result.success) {
                    process.exit(1);
                }
            } else {
                testIsRunning = true;
                runTestCase(device);
            }
        }

        if (event.type === 'device-thp_credentials_changed') {
            const { credentials } = event.payload;
            console.log('THP credentials', event.payload.credentials);
            const state = readCliState();
            if (!state.credentials.find(c => c.credential === credentials.credential)) {
                state.credentials.push(credentials);
                writeCliState(state);
            }
        }

        if (event.type === 'device-thp_pairing_status_changed') {
            if (event.payload.status === 'failed') {
                console.warn('THP phase error', event.payload.message);
            } else {
                console.warn('THP phase changed', event.payload.status);
            }
        }
    });

    TrezorConnect.on('UI_EVENT', async event => {
        console.warn('UI_EVENT', event.type);

        if (event.type === 'ui-request_confirmation') {
            return TrezorConnect.uiResponse({
                type: 'ui-receive_confirmation',
                payload: true,
                requestId: event.requestId,
            });
        }

        if (event.type === 'ui-request_passphrase') {
            if (args['cancel-passphrase']) {
                return TrezorConnect.cancel();
            }
            if (args['cancel-passphrase-ui']) {
                // respond with no passphrase
                // @ts-expect-error
                return TrezorConnect.uiResponse({
                    type: 'ui-receive_passphrase',
                    requestId: event.requestId,
                });
            }

            const value = args.passphrase || '';
            TrezorConnect.uiResponse({
                type: 'ui-receive_passphrase',
                payload: { value, passphraseOnDevice: args['passphrase-on-device'] },
                requestId: event.requestId,
            });
        }

        if (event.type === 'ui-request_thp_pairing') {
            const tag = await waitForPairingTag(event);
            if (tag) {
                TrezorConnect.uiResponse({
                    type: 'ui-receive_thp_pairing_tag',
                    payload: { tag },
                    requestId: event.requestId,
                });
            } else {
                return TrezorConnect.cancel();
            }
        }

        if (event.type === 'ui-button') {
            if (!isDebugLinkInteraction('button')) {
                const resp = await waitForStdio(
                    `Confirm ${event.payload.code} (${event.payload.name}) on device or type [c] for Cancel:`,
                ).promise;
                if (resp === 'c') {
                    TrezorConnect.cancel();
                }
            } else {
                await debugLinkDecision();
            }
        }
    });

    let pairingMethods: any[] = ['CodeEntry', 'QrCode', 'NFC', 'SkipPairing'];
    if (args.pairing === 'none') {
        pairingMethods = ['SkipPairing'].concat(pairingMethods.filter(m => m === 'SkipPairing'));
    }
    if (args.pairing === 'qr') {
        pairingMethods = ['QrCode'].concat(pairingMethods.filter(m => m === 'QrCode'));
    }
    if (args.pairing === 'nfc') {
        pairingMethods = ['NFC'].concat(pairingMethods.filter(m => m === 'NFC'));
    }

    await initDebugLink();
    const transport = await getTransport();

    await TrezorConnect.init({
        manifest: { appUrl: 'a', appName: 'TrezorConnect Cli', email: 'b' },
        transports: [transport],
        pendingTransportEvent: false,
        debug: args.debug,
        thp: {
            appName: 'TrezorConnect Cli',
            hostName: 'localhost',
            knownCredentials: getThpCredentials(),
            pairingMethods,
        },
    });
};

run();
