/* eslint-disable no-console */
import * as messages from '@trezor/protobuf/messages.json';
// import { v2 as protocolV2, thp } from '@trezor/protocol';

import TrezorConnect, { Device } from './src';
import { NodeUsbTransport, UdpTransport } from '../transport/src';

// eslint-disable-next-line import/no-extraneous-dependencies
const argv = require('minimist')(process.argv.slice(2));

const debugTransport =
    argv._.includes('udp') || argv.udp
        ? new UdpTransport({ id: 'udp', messages, debugLink: true })
        : new NodeUsbTransport({ id: 'usb', messages, debugLink: true });

const initDebugLink = async () => {
    await debugTransport.init();

    const enumerate = await debugTransport.enumerate();
    if (!enumerate.success) {
        return;
    }
};

const debugLinkState = async (uiEvent: any) => {
    const enumerate = await debugTransport.enumerate();
    if (!enumerate.success) {
        throw new Error(enumerate.error);
    }
    const acquire = await debugTransport.acquire({ input: enumerate.payload[0] as any });
    if (!acquire.success) {
        throw new Error(acquire.error);
    }

    const { channel } = uiEvent.device.thp;
    // const highBytes = Buffer.from(channel, 'hex').readUInt16LE();
    // const value = highBytes << 16; // shift the highBytes by 16 bits to form a uint32

    let nfc_secret_host, handshake_hash;
    if (uiEvent.nfcData) {
        const nfcData = Buffer.from(uiEvent.nfcData, 'hex');
        nfc_secret_host = nfcData.subarray(0, 16);
        handshake_hash = nfcData.subarray(16);
    }

    const session = acquire.payload;
    const response = await debugTransport.call({
        name: 'DebugLinkGetPairingInfo',
        data: {
            channel_id: Buffer.from(channel, 'hex'),
            handshake_hash,
            nfc_secret_host,
        },
        session,
    });

    console.warn('DebugLinkState', response);

    await debugTransport.release({ ...enumerate.payload[0], session });
    await debugTransport.enumerate();

    return response;
};

const debugLinkDecision = async () => {
    if (argv['interaction']) return;

    console.warn('debugLinkDecision-1');
    const enumerate = await debugTransport.enumerate();
    // disable auto click
    // if (enumerate) return;
    if (!enumerate.success) {
        throw new Error(enumerate.error);
    }

    const acquire = await debugTransport.acquire({ input: enumerate.payload[0] as any });
    if (!acquire.success) {
        throw new Error(acquire.error);
    }

    const session = acquire.payload;
    const callRes = await debugTransport
        .send({
            name: 'DebugLinkDecision',
            data: { button: 1 },
            session,
        })
        .then(r => {
            console.warn('debugLinkDecision-4', r);

            return r;
        });

    console.warn('debugLinkDecision-5', callRes);

    const release = await debugTransport.release({ ...enumerate.payload[0], session });
    console.warn('debugLinkDecision-6', release);
    const enum2 = await debugTransport.enumerate();

    console.warn('debugLinkDecision-end', enum2);
};

const getFeatures = (device: Device) =>
    TrezorConnect.getFeatures({
        device,
    });

const fwUpdate = (device: Device) =>
    TrezorConnect.firmwareUpdate({
        device,
        baseUrl: '/home/slesisz/Workspace/suite/packages/connect-common/files',
    });

const signTx = (device: Device) => {
    const inputs = [];
    for (let i = 0; i < 10; i++) {
        inputs.push({
            address_n: `m/44'/1'/1'/0/${i}`,
            prev_hash: '3019487f064329247daad245aed7a75349d09c14b1d24f170947690e030f5b20',
            prev_index: i,
            amount: 14598,
        });
    }

    const outputs = [];
    for (let i = 0; i < 4; i++) {
        const output = {
            address: 'momtnzR3XqXgDSsFmd8gkGxUiHZLde3RmA',
            amount: 7129,
            script_type: 'PAYTOADDRESS',
        };

        outputs.push(output);
    }

    return TrezorConnect.signTransaction({
        device,
        coin: 'Testnet',
        inputs,
        outputs: [
            {
                address: 'mnY26FLTzfC94mDoUcyDJh1GVE3LuAUMbs',
                amount: 10 * 14_598 - 60_000,
            },
        ],
    });
};

const runTestCase = async (device: Device) => {
    const testCase = argv.t || argv.test;
    if (testCase === 'none') {
        console.log('missing test. exiting...');
        process.exit(1);
    }

    // device is ready, start the test
    let result;
    if (testCase === 'passphrase') {
        const expectedState: `${string}@${string}` = `mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@${device.id}`;
        result = await TrezorConnect.getAddress({
            device: {
                ...device,
                state: {
                    sessionId: '1', // not exist
                    staticSessionId: `${expectedState}:0`,
                },
            },
            path: "m/44'/0'/0'/0/0",
        });
        if (!result.success) {
            throw new Error(result.payload.error);
        }

        result = await TrezorConnect.getAddress({
            device: {
                ...device,
                instance: 1,
                state: {
                    sessionId: result.device?.state?.sessionId, //recycle previous
                    staticSessionId: `${expectedState}:1`,
                },
            },
            path: "m/44'/0'/0'/0/0",
        });
    } else if (testCase === 'sign') {
        result = await signTx(device);
    } else if (testCase === 'fwupdate') {
        result = await fwUpdate(device);
    } else if (testCase === 'wipe') {
        result = await TrezorConnect.wipeDevice({ device });
    } else {
        result = await TrezorConnect.getAddress({
            device,
            path: "m/44'/0'/0'/0/0",
        });
    }

    console.warn(result);
    process.exit(1);
};

const run = async () => {
    await initDebugLink();

    // const testStart = Date.now();
    TrezorConnect.on('DEVICE_EVENT', async event => {
        // console.warn('DEVICE_EVENT', event);
        if (event.type === 'device-connect_unacquired' || event.type === 'device-connect') {
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
                    console.warn(result);
                    process.exit(1);
                }
            } else {
                runTestCase(device);
            }
        }
    });

    const ignoreUiEvent = ['ui-device_firmware_outdated'];

    TrezorConnect.on('UI_EVENT', async event => {
        if (ignoreUiEvent.includes(event.type)) {
            return;
        }
        console.warn('UI_EVENT', event);

        if (event.type === 'ui-request_pin') {
            setTimeout(() => TrezorConnect.cancel(), 1000);

            // TrezorConnect.uiResponse({
            //     type: 'ui-receive_pin',
            //     payload: null,
            // });
        }

        if (event.type === 'ui-request_confirmation') {
            return TrezorConnect.uiResponse({
                type: 'ui-receive_confirmation',
                payload: true,
            });
        }

        if (event.type === 'ui-button') {
            const name = event.payload?.name;
            if (argv.pairing === 'cancel-pairing' && name === 'thp_pairing_request') {
                return setTimeout(() => TrezorConnect.cancel(), 2000);
            }

            if (argv.pairing === 'cancel-pairing' && name === 'thp_connection_request') {
                return setTimeout(() => TrezorConnect.cancel(), 2000);
            }

            if (
                argv.pairing === 'cancel-autoconnect' &&
                name === 'thp_autoconnect_credential_request'
            ) {
                return setTimeout(() => TrezorConnect.cancel(), 2000);
            }
        }

        if (event.type === 'ui-request_passphrase') {
            if (argv['cancel-passphrase']) {
                return TrezorConnect.cancel();
            }
            if (argv['cancel-passphrase-ui']) {
                // respond with no passphrase
                // @ts-expect-error
                return TrezorConnect.uiResponse({
                    type: 'ui-receive_passphrase',
                });
            }

            const value = argv['passphrase'] || '';
            TrezorConnect.uiResponse({
                type: 'ui-receive_passphrase',
                payload: { value, passphraseOnDevice: argv['passphrase-on-device'] },
            });
        }

        if (event.type === 'ui-request_thp_autoconnect') {
            TrezorConnect.uiResponse({
                type: 'ui-receive_thp_autoconnect',
                payload: { autoconnect: true },
            });
        }

        if (event.type === 'ui-request_thp_pairing') {
            if (argv.pairing === 'stop') {
                return;
            }
            if (argv.pairing === 'cancel') {
                return TrezorConnect.cancel();
            }
            if (argv.pairing === 'ui-cancel') {
                // @ts-expect-error
                return TrezorConnect.uiResponse({
                    type: 'ui-receive_thp_pairing_tag',
                    // no payload will reject as cancel
                });
            }

            const state = await debugLinkState(event.payload);
            if (!state?.success) {
                throw new Error('DebugLinkState missing: ' + state.error);
            }
            if (state.payload.type !== 'DebugLinkPairingInfo') {
                throw new Error('DebugLinkState missing, received ' + state.payload.type);
            }

            const { code_entry_code, code_qr_code, nfc_secret_trezor } = state.payload.message;

            let response: any;
            if (event.payload.selectedMethod === 3) {
                response = {
                    source: 'qr-code',
                    tag: code_qr_code,
                };
            } else if (event.payload.selectedMethod === 4) {
                response = {
                    source: 'nfc',
                    tag: nfc_secret_trezor,
                };
            } else if (event.payload.selectedMethod === 2) {
                response = {
                    source: 'code-entry',
                    tag: code_entry_code?.toString(),
                };
            }

            if (!response) {
                throw new Error(`selectedMethod: ${event.payload.selectedMethod} not recognized`);
            }

            TrezorConnect.uiResponse({
                type: 'ui-receive_thp_pairing_tag',
                payload: response,
            });
        }

        if (event.type === 'ui-button') {
            // console.warn('RESOLVE!');
            // TrezorConnect.cancel();
            await debugLinkDecision();
        }
    });

    let transport: any = 'NodeUsbTransport';
    if (argv._.includes('udp')) {
        transport = 'UdpTransport';
    } else if (argv._.includes('bridge')) {
        transport = 'BridgeTransport';
    }

    let pairingMethods: any[] = ['CodeEntry', 'QrCode', 'NFC', 'SkipPairing'];
    if (argv.pairing === 'none') {
        pairingMethods = ['SkipPairing'].concat(pairingMethods.filter(m => m === 'SkipPairing'));
    }
    if (argv.pairing === 'qr') {
        pairingMethods = ['QrCode'].concat(pairingMethods.filter(m => m === 'QrCode'));
    }
    if (argv.pairing === 'nfc') {
        pairingMethods = ['NFC'].concat(pairingMethods.filter(m => m === 'NFC'));
    }

    let knownCredentials: any = [];
    if (argv.credentials) {
        knownCredentials = [
            // Trezor
            {
                trezor_static_pubkey:
                    'f7dd7fc6c5fd6d07b8155d07a4cc9e64edb310607f7458f5d8dc2664e7822f34',
                credential:
                    '0a110a0d5472657a6f72436f6e6e6563741000122059fb40867894e27d263e0ad05974c32054205cc3224c4e38ab90b46b7e30953d',
            },
            // Emulator
            {
                trezor_static_pubkey:
                    '2bcdbc9fd7949c3f37aa80a53801f52ec554facfe76118030926294250fd6838',
                credential:
                    '0a110a0d5472657a6f72436f6e6e65637410001220b3c95548dedcc56a126d6b2c0258514dadc21a7855b980375bd46e1da1478df6',
            },
        ];
    }
    if (argv.autoconnect) {
        knownCredentials = [
            // Trezor
            {
                trezor_static_pubkey:
                    'f7dd7fc6c5fd6d07b8155d07a4cc9e64edb310607f7458f5d8dc2664e7822f34',
                credential:
                    '0a110a0d5472657a6f72436f6e6e65637410011220a0a5acdb1f499e5693f79368602aa8971aa461263e76479e57babd8817d7034d',
                autoconnect: true,
            },
            // // Emulator
            {
                trezor_static_pubkey:
                    '2bcdbc9fd7949c3f37aa80a53801f52ec554facfe76118030926294250fd6838',
                credential:
                    '0a110a0d5472657a6f72436f6e6e65637410011220b97509ef252b07dcc70071c9d13dd70746d8a9fb671765049ca74e58b9058d6b',
                autoconnect: true,
            },
        ];
    }

    await TrezorConnect.init({
        manifest: { appUrl: 'a', email: 'b' },
        transports: [transport],
        pendingTransportEvent: false,
        // lazyLoad: true,
        debug: true,
        thp: {
            hostName: 'TrezorConnect',
            staticKey: '0007070707070707070707070707070707070707070707070707070707070747',
            knownCredentials,
            pairingMethods,
        },
    });
};

run();
