// eslint-disable-next-line import/no-extraneous-dependencies
import minimist from 'minimist';
import TrezorConnect from './src';

import * as messages from '@trezor/protobuf/messages.json';
import { v2 as protocolV2, thp } from '@trezor/protocol';
import { NodeUsbTransport, UdpTransport } from '../transport/src';

const argv = minimist(process.argv.slice(2));

const abort = new AbortController();
const debugTransport =
    argv._.includes('udp') || argv.udp
        ? new UdpTransport({ messages, debugLink: true, signal: abort.signal })
        : new NodeUsbTransport({ messages, debugLink: true, signal: abort.signal });

const initDebugLink = async () => {
    if (!debugTransport.stopped) {
        return;
    }
    const init = await debugTransport.init();

    const enumerate = await debugTransport.enumerate();
    if (!enumerate.success) {
        return;
    }
};

const debugLinkState = async channel => {
    const enumerate = await debugTransport.enumerate();
    if (!enumerate.success) {
        return;
    }
    const acquire = await debugTransport.acquire({ input: enumerate.payload[0] });

    const highBytes = Buffer.from(channel, 'hex').readUInt16LE(); // Read the two bytes as a uint16
    const value = highBytes << 16; // Shift the highBytes by 16 bits to form a uint32

    const response = await debugTransport.call({
        name: 'DebugLinkGetState',
        data: { thp_channel_id: Buffer.from(channel, 'hex') },
        session: acquire.payload,
    });

    console.warn('DebugLinkState', response);

    await debugTransport.release(enumerate.payload[0]);
    await debugTransport.enumerate();

    return response;
};

const debugLinkDecision = async () => {
    console.warn('debugLinkDecision-1');
    const enumerate = await debugTransport.enumerate();
    if (!enumerate.success) {
        return;
    }
    console.warn('debugLinkDecision-2', enumerate);
    const acquire = await debugTransport.acquire({ input: enumerate.payload[0] });
    console.warn('debugLinkDecision-3', acquire);
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

    const rele = await debugTransport.release({ ...enumerate.payload[0], session });
    console.warn('debugLinkDecision-6', rele);
    const enum2 = await debugTransport.enumerate();

    console.warn('debugLinkDecision-end', enum2);
};

const getFeatures = device => {
    return TrezorConnect.getFeatures({
        device,
    });
};

const signTx = device => {
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

const run = async () => {
    await initDebugLink();

    const testStart = Date.now();
    TrezorConnect.on('DEVICE_EVENT', async event => {
        console.warn('DEVICE_EVENT', event);
        if (event.type === 'device-connect_unacquired' || event.type === 'device-connect') {
            const device = event.payload;
            if (device.features && device.mode === 'initialize') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                await TrezorConnect.resetDevice({
                    device,
                    pin: '',
                    label: 'THP device',
                    passphrase_protection: true,
                });
            }

            if (!device.features && device.properties) {
                // start pairing
                await getFeatures(device);
            } else {
                const testCase = argv.t || argv.test;
                if (testCase === 'none') {
                    return;
                }

                // device is ready, start the test
                let result;
                if (testCase === 'getAddress') {
                    result = await TrezorConnect.getAddress({
                        device,
                        path: "m/44'/0'/0'/0/0",
                    });
                } else if (testCase === 'passphrase') {
                    result = await TrezorConnect.getAddress({
                        device: {
                            ...device,
                            state: {
                                sessionId: 1,
                                staticSessionId:
                                    'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@355C817510C0EABF2F147145:0',
                            },
                        },
                        path: "m/44'/0'/0'/0/0",
                    });
                    result = await TrezorConnect.getAddress({
                        device: {
                            ...device,
                            // instance: 1,
                            state: {
                                sessionId: 1,
                                staticSessionId:
                                    'WW-mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@355C817510C0EABF2F147145:0',
                            },
                        },
                        path: "m/44'/0'/0'/0/0",
                    });
                } else {
                    result = await signTx(device);
                }

                console.warn(result);
                process.exit(1);
            }
        }
    });

    TrezorConnect.on('UI_EVENT', async event => {
        console.warn('UI_EVENT', event);

        if (event.type === 'ui-request_pin') {
            setTimeout(() => TrezorConnect.cancel(), 1000);

            // TrezorConnect.uiResponse({
            //     type: 'ui-receive_pin',
            //     payload: null,
            // });
        }

        if (event.type === 'ui-request_passphrase') {
            if (argv['cancel-passphrase']) {
                return TrezorConnect.cancel();
            }
            if (argv['cancel-passphrase-ui']) {
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

        if (event.type === 'ui-request_thp_pairing') {
            if (argv.pairing === 'stop') {
                return;
            }
            if (argv.pairing === 'cancel') {
                return TrezorConnect.cancel();
            }
            if (argv.pairing === 'ui-cancel') {
                return TrezorConnect.uiResponse({
                    type: 'ui-receive_thp_pairing_tag',
                    // no payload will reject as cancel
                });
            }

            const state = await debugLinkState(event.payload.device.protocolState?.channel);
            if (!state?.success) {
                throw new Error('DebugLinkState missing: ' + state.error);
            }

            const {
                thp_pairing_code_entry_code,
                thp_pairing_code_qr_code,
                thp_pairing_code_nfc_unidirectional,
            } = state.payload.message;

            let response = {
                source: 'code-entry',
                value: thp_pairing_code_entry_code.toString(),
            };
            if (argv.pairing === 'qr') {
                response = {
                    source: 'qr-code',
                    value: thp_pairing_code_qr_code,
                };
            }
            if (argv.pairing === 'nfc') {
                response = {
                    source: 'nfc',
                    value: thp_pairing_code_nfc_unidirectional,
                };
            }
            // const state = { payload: { message: {} } };
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

    let transport = 'NodeUsbTransport';
    if (argv._.includes('udp')) {
        transport = 'UdpTransport';
    } else if (argv._.includes('bridge')) {
        transport = 'BridgeTransport';
    }

    let pairingMethods = ['CodeEntry', 'QrCode', 'NFC_Unidirectional'];
    if (argv.pairing === 'none') {
        pairingMethods = ['NoMethod'];
    }

    let knownCredentials = [];
    if (argv.c || argv.credentials) {
        knownCredentials = [
            // Trezor
            {
                trezor_static_pubkey:
                    '1317c99c16fce04935782ed250cf0cacb12216f739cea55257258a2ff9440763',
                credential:
                    '0a0f0a0d5472657a6f72436f6e6e6563741220f69918996c0afa1045b3625d06e7e816b0c4c4bd3902dfd4cad068b3f2425ec8',
            },
            // Emulator
            {
                trezor_static_pubkey:
                    '8a6c7ef08a100a29a59aaded32eb13e99b5740ce1489596d56f9e045045f8676',
                credential:
                    '0a0f0a0d5472657a6f72436f6e6e65637412208f9a7d0ecb7b356752c7eeb308539f24683c1cd7ae93ad3426bbe7b32f304834',
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
            staticKeys: '0007070707070707070707070707070707070707070707070707070707070747',
            knownCredentials,
            pairingMethods,
        },
    });
};

run();
