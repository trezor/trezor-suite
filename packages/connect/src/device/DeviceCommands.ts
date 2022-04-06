// original file https://github.com/trezor/connect/blob/develop/src/js/device/DeviceCommands.js

import randombytes from 'randombytes';
import { Transport, Messages } from '@trezor/transport';
import { ERRORS, NETWORK } from '../constants';
import { DEVICE } from '../events';
import * as hdnodeUtils from '../utils/hdnodeUtils';
import {
    isMultisigPath,
    isSegwitPath,
    isBech32Path,
    isTaprootPath,
    getSerializedPath,
    getScriptType,
    fromHardened,
    toHardened,
} from '../utils/pathUtils';
import { getAccountAddressN } from '../utils/accountUtils';
import { versionCompare } from '../utils/versionUtils';
import { getSegwitNetwork, getBech32Network } from '../data/CoinInfo';

import type { IDevice } from './Device';
import type { CoinInfo, BitcoinNetworkInfo, Network } from '../types';
import type { HDNodeResponse } from '../types/api/getPublicKey';

export type DefaultMessageResponse = {
    type: any;
    message: any; // in general, can be anything
};

export type PassphrasePromptResponse = {
    passphrase?: string;
    passphraseOnDevice?: boolean;
    cache?: boolean;
};

const assertType = (res: DefaultMessageResponse, resType: string) => {
    const splitResTypes = resType.split('|');
    if (!splitResTypes.includes(res.type)) {
        throw ERRORS.TypedError(
            'Runtime',
            `assertType: Response of unexpected type: ${res.type}. Should be ${resType}`,
        );
    }
};

const generateEntropy = (len: number) => {
    try {
        return randombytes(len);
    } catch (err) {
        throw ERRORS.TypedError(
            'Runtime',
            'generateEntropy: Environment does not support crypto random',
        );
    }
};

const filterForLog = (type: string, msg: any) => {
    const blacklist: { [key: string]: Record<string, string> } = {
        // PassphraseAck: {
        //     passphrase: '(redacted...)',
        // },
        // CipheredKeyValue: {
        //     value: '(redacted...)',
        // },
        // GetPublicKey: {
        //     address_n: '(redacted...)',
        // },
        // PublicKey: {
        //     node: '(redacted...)',
        //     xpub: '(redacted...)',
        // },
        // DecryptedMessage: {
        //     message: '(redacted...)',
        //     address: '(redacted...)',
        // },
    };

    if (type in blacklist) {
        return { ...msg, ...blacklist[type] };
    }
    return msg;
};

export default class DeviceCommands {
    device: IDevice;

    transport: Transport;

    sessionId: string;

    debug: boolean;

    disposed: boolean;

    callPromise?: Promise<DefaultMessageResponse>;

    // see DeviceCommands.cancel
    _cancelableRequest?: (error?: any) => void;

    constructor(device: IDevice, transport: Transport, sessionId: string) {
        this.device = device;
        this.transport = transport;
        this.sessionId = sessionId;
        this.debug = false;
        this.disposed = false;
    }

    dispose() {
        this.disposed = true;
        this._cancelableRequest = undefined;
    }

    isDisposed() {
        return this.disposed;
    }

    async getPublicKey(
        address_n: number[],
        coin_name = 'Bitcoin',
        script_type?: Messages.InputScriptType,
        show_display?: boolean,
    ) {
        const response = await this.typedCall('GetPublicKey', 'PublicKey', {
            address_n,
            coin_name,
            script_type,
            show_display,
        });
        return response.message;
    }

    // Validation of xpub
    async getHDNode(
        path: number[],
        coinInfo?: BitcoinNetworkInfo,
        validation = true,
        showOnTrezor = false,
    ) {
        if (!this.device.atLeast(['1.7.2', '2.0.10']) || !coinInfo) {
            return this.getBitcoinHDNode(path, coinInfo);
        }

        let network: Network | undefined | null;
        if (isMultisigPath(path)) {
            network = coinInfo.network;
        } else if (isSegwitPath(path)) {
            network = getSegwitNetwork(coinInfo);
        } else if (isBech32Path(path)) {
            network = getBech32Network(coinInfo);
        }

        let scriptType: Messages.InternalInputScriptType | undefined = getScriptType(path);
        if (!network) {
            network = coinInfo.network;
            if (scriptType !== 'SPENDADDRESS') {
                scriptType = undefined;
            }
        }

        let publicKey: Messages.PublicKey;
        if (showOnTrezor || !validation) {
            publicKey = await this.getPublicKey(path, coinInfo.name, scriptType, showOnTrezor);
        } else {
            const suffix = 0;
            const childPath = path.concat([suffix]);
            const resKey = await this.getPublicKey(path, coinInfo.name, scriptType);
            const childKey = await this.getPublicKey(childPath, coinInfo.name, scriptType);
            publicKey = hdnodeUtils.xpubDerive(resKey, childKey, suffix, network, coinInfo.network);
        }

        const response: HDNodeResponse = {
            path,
            serializedPath: getSerializedPath(path),
            childNum: publicKey.node.child_num,
            xpub: publicKey.xpub,
            chainCode: publicKey.node.chain_code,
            publicKey: publicKey.node.public_key,
            fingerprint: publicKey.node.fingerprint,
            depth: publicKey.node.depth,
        };

        if (network !== coinInfo.network) {
            response.xpubSegwit = response.xpub;
            response.xpub = hdnodeUtils.convertXpub(publicKey.xpub, network, coinInfo.network);
        }

        return response;
    }

    // deprecated
    // legacy method (below FW 1.7.2 & 2.0.10), remove it after next "required" FW update.
    // keys are exported in BTC format and converted to proper format in hdnodeUtils
    // old firmware didn't return keys with proper prefix (ypub, Ltub.. and so on)
    async getBitcoinHDNode(path: number[], coinInfo?: BitcoinNetworkInfo, validation = true) {
        let publicKey: Messages.PublicKey;
        if (!validation) {
            publicKey = await this.getPublicKey(path);
        } else {
            const suffix = 0;
            const childPath = path.concat([suffix]);

            const resKey = await this.getPublicKey(path);
            const childKey = await this.getPublicKey(childPath);
            publicKey = hdnodeUtils.xpubDerive(resKey, childKey, suffix);
        }

        const response: HDNodeResponse = {
            path,
            serializedPath: getSerializedPath(path),
            childNum: publicKey.node.child_num,
            xpub: coinInfo
                ? hdnodeUtils.convertBitcoinXpub(publicKey.xpub, coinInfo.network)
                : publicKey.xpub,
            chainCode: publicKey.node.chain_code,
            publicKey: publicKey.node.public_key,
            fingerprint: publicKey.node.fingerprint,
            depth: publicKey.node.depth,
        };

        // if requested path is a segwit or bech32
        // convert xpub to new format
        if (coinInfo) {
            const bech32Network = getBech32Network(coinInfo);
            const segwitNetwork = getSegwitNetwork(coinInfo);
            if (bech32Network && isBech32Path(path)) {
                response.xpubSegwit = hdnodeUtils.convertBitcoinXpub(publicKey.xpub, bech32Network);
            } else if (segwitNetwork && isSegwitPath(path)) {
                response.xpubSegwit = hdnodeUtils.convertBitcoinXpub(publicKey.xpub, segwitNetwork);
            }
        }
        return response;
    }

    async getAddress(
        { address_n, show_display, multisig, script_type }: Messages.GetAddress,
        coinInfo: BitcoinNetworkInfo,
    ) {
        if (!script_type) {
            script_type = getScriptType(address_n);
            if (script_type === 'SPENDMULTISIG' && !multisig) {
                script_type = 'SPENDADDRESS';
            }
        }
        if (multisig && multisig.pubkeys) {
            // convert xpub strings to HDNodeTypes
            multisig.pubkeys.forEach(pk => {
                if (typeof pk.node === 'string') {
                    pk.node = hdnodeUtils.xpubToHDNodeType(pk.node, coinInfo.network);
                }
            });
        }
        const response = await this.typedCall('GetAddress', 'Address', {
            address_n,
            coin_name: coinInfo.name,
            show_display,
            multisig,
            script_type: script_type || 'SPENDADDRESS',
        });

        return {
            path: address_n,
            serializedPath: getSerializedPath(address_n),
            address: response.message.address,
        };
    }

    async ethereumGetAddress({ address_n, show_display }: Messages.EthereumGetAddress) {
        const response = await this.typedCall('EthereumGetAddress', 'EthereumAddress', {
            address_n,
            show_display,
        });
        return {
            path: address_n,
            serializedPath: getSerializedPath(address_n),
            address: response.message.address,
        };
    }

    async ethereumGetPublicKey({
        address_n,
        show_display,
    }: Messages.EthereumGetPublicKey): Promise<HDNodeResponse> {
        if (!this.device.atLeast(['1.8.1', '2.1.0'])) {
            return this.getHDNode(address_n);
        }

        const suffix = 0;
        const childPath = address_n.concat([suffix]);
        const resKey = await this.typedCall('EthereumGetPublicKey', 'EthereumPublicKey', {
            address_n,
            show_display,
        });
        const childKey = await this.typedCall('EthereumGetPublicKey', 'EthereumPublicKey', {
            address_n: childPath,
            show_display: false,
        });
        const publicKey = hdnodeUtils.xpubDerive(resKey.message, childKey.message, suffix);

        return {
            path: address_n,
            serializedPath: getSerializedPath(address_n),
            childNum: publicKey.node.child_num,
            xpub: publicKey.xpub,
            chainCode: publicKey.node.chain_code,
            publicKey: publicKey.node.public_key,
            fingerprint: publicKey.node.fingerprint,
            depth: publicKey.node.depth,
        };
    }

    getDeviceState(networkType?: string) {
        // cardano backwards compatibility. we only need this for firmware before initialize.derive_cardano message was introduced
        if (!this.device.atLeast('2.4.3')) {
            return this._getAddressForNetworkType(networkType);
        }

        // skipping network type parameter intentionally
        return this._getAddressForNetworkType();

        // bitcoin.crypto.hash256(Buffer.from(secret, 'binary')).toString('hex');
    }

    // Sends an async message to the opened device.
    async call(type: Messages.MessageKey, msg: any = {}) {
        if (this.debug) {
            const logMessage = filterForLog(type, msg);
            // eslint-disable-next-line no-console
            console.log('[DeviceCommands] [call] Sending', type, logMessage, this.transport);
        }

        try {
            this.callPromise = this.transport.call(this.sessionId, type, msg, false);
            const res = await this.callPromise;
            const logMessage = filterForLog(res.type, res.message);
            if (this.debug) {
                // eslint-disable-next-line no-console
                console.log('[DeviceCommands] [call] Received', res.type, logMessage);
            }
            return res;
        } catch (error) {
            if (this.debug) {
                // eslint-disable-next-line no-console
                console.warn('[DeviceCommands] [call] Received error', error);
            }
            // TODO: throw trezor error
            throw error;
        }
    }

    async typedCall<T extends Messages.MessageKey, R extends Messages.MessageKey>(
        type: T,
        resType: R,
        msg?: Messages.MessageType[T],
    ): Promise<Messages.MessageResponse<R>> {
        if (this.disposed) {
            throw ERRORS.TypedError('Runtime', 'typedCall: DeviceCommands already disposed');
        }

        const response = await this._commonCall(type, msg);
        try {
            assertType(response, resType);
        } catch (error) {
            // handle possible race condition
            // Bridge may have some unread message in buffer, read it
            await this.transport.read(this.sessionId, false);
            // throw error anyway, next call should be resolved properly
            throw error;
        }
        return response;
    }

    // REF-TODO: probably not very good return type
    async _commonCall(type: Messages.MessageKey, msg?: any): Promise<DefaultMessageResponse> {
        const resp = await this.call(type, msg);
        return this._filterCommonTypes(resp);
    }

    _filterCommonTypes(res: DefaultMessageResponse) {
        if (res.type === 'Failure') {
            const { code } = res.message;
            let { message } = res.message;
            // Model One does not send any message in firmware update
            // https://github.com/trezor/trezor-firmware/issues/1334
            if (code === 'Failure_FirmwareError' && !message) {
                message = 'Firmware installation failed';
            }
            // Failure_ActionCancelled message could be also missing
            // https://github.com/trezor/connect/issues/865
            if (code === 'Failure_ActionCancelled' && !message) {
                message = 'Action cancelled by user';
            }
            // pass code and message from firmware error
            return Promise.reject(new ERRORS.TrezorError(code, message));
        }

        if (res.type === 'Features') {
            return Promise.resolve(res);
        }

        if (res.message.code === '_Deprecated_ButtonRequest_PassphraseType') {
            // for backwards compatibility stick to old message type
            // which was part of protobuf in versions < 2.3.0
            res.message.code = 'ButtonRequest_PassphraseType';
        }

        if (res.type === 'ButtonRequest') {
            if (res.message.code === 'ButtonRequest_PassphraseEntry') {
                this.device.emit(DEVICE.PASSPHRASE_ON_DEVICE, this.device);
            } else {
                this.device.emit(DEVICE.BUTTON, this.device, res.message);
            }
            return this._commonCall('ButtonAck', {});
        }

        if (res.type === 'EntropyRequest') {
            return this._commonCall('EntropyAck', {
                entropy: generateEntropy(32).toString('hex'),
            });
        }

        if (res.type === 'PinMatrixRequest') {
            return this._promptPin(res.message.type).then(
                pin => this._commonCall('PinMatrixAck', { pin }),
                () => this._commonCall('Cancel', {}),
            );
        }

        if (res.type === 'PassphraseRequest') {
            const state = this.device.getInternalState();
            const legacy = this.device.useLegacyPassphrase();
            const legacyT1 = legacy && this.device.isT1();

            // T1 fw lower than 1.9.0, passphrase is cached in internal state
            if (legacyT1 && typeof state === 'string') {
                return this._commonCall('PassphraseAck', { passphrase: state });
            }

            // TT fw lower than 2.3.0, entering passphrase on device
            if (legacy && res.message._on_device) {
                this.device.emit(DEVICE.PASSPHRASE_ON_DEVICE, this.device);
                return this._commonCall('PassphraseAck', { _state: state });
            }

            return this._promptPassphrase().then(
                response => {
                    const { passphrase, passphraseOnDevice, cache } = response;
                    if (legacyT1) {
                        this.device.setInternalState(cache ? passphrase : undefined);
                        return this._commonCall('PassphraseAck', { passphrase });
                    }
                    if (legacy) {
                        return this._commonCall('PassphraseAck', { passphrase, _state: state });
                    }
                    return !passphraseOnDevice
                        ? this._commonCall('PassphraseAck', { passphrase })
                        : this._commonCall('PassphraseAck', { on_device: true });
                },
                err =>
                    this._commonCall('Cancel', {}).catch((e: any) => {
                        throw err || e;
                    }),
            );
        }

        // TT fw lower than 2.3.0, device send his current state
        // new passphrase design set this value from `features.session_id`
        if (res.type === 'Deprecated_PassphraseStateRequest') {
            const { state } = res.message;
            this.device.setInternalState(state);
            return this._commonCall('Deprecated_PassphraseStateAck', {});
        }

        if (res.type === 'WordRequest') {
            return this._promptWord(res.message.type).then(
                word => this._commonCall('WordAck', { word }),
                () => this._commonCall('Cancel', {}),
            );
        }

        return Promise.resolve(res);
    }

    async _getAddressForNetworkType(networkType?: string) {
        switch (networkType) {
            case NETWORK.TYPES.cardano: {
                // $FlowIssue derivation_type is not available for older firmwares
                const { message } = await this.typedCall('CardanoGetAddress', 'CardanoAddress', {
                    // REF-TODO: staking_address_n is missing
                    // @ts-ignore
                    address_parameters: {
                        address_type: 8, // Byron
                        address_n: [toHardened(44), toHardened(1815), toHardened(0), 0, 0],
                    },
                    protocol_magic: 42,
                    network_id: 0,
                    // derivation type doesn't really matter as it is not recognized by older firmwares.
                    // but it is a required field withing protobuf definitions so we must provide something here
                    derivation_type: 2, // icarus_trezor
                });
                return message.address;
            }
            default: {
                const { message } = await this.typedCall('GetAddress', 'Address', {
                    address_n: [toHardened(44), toHardened(1), toHardened(0), 0, 0],
                    coin_name: 'Testnet',
                    script_type: 'SPENDADDRESS',
                });
                return message.address;
            }
        }
    }

    _promptPin(type: string) {
        return new Promise<string>((resolve, reject) => {
            if (this.device.listenerCount(DEVICE.PIN) > 0) {
                this._cancelableRequest = reject;
                // REF-TODO improve types
                // @ts-ignore
                this.device.emit(DEVICE.PIN, this.device, type, (err, pin) => {
                    this._cancelableRequest = undefined;
                    if (err || pin == null) {
                        reject(err);
                    } else {
                        resolve(pin);
                    }
                });
            } else {
                // eslint-disable-next-line no-console
                console.warn(
                    '[DeviceCommands] [call] PIN callback not configured, cancelling request',
                );
                reject(ERRORS.TypedError('Runtime', '_promptPin: PIN callback not configured'));
            }
        });
    }

    _promptPassphrase() {
        return new Promise<PassphrasePromptResponse>((resolve, reject) => {
            if (this.device.listenerCount(DEVICE.PASSPHRASE) > 0) {
                this._cancelableRequest = reject;
                this.device.emit(
                    DEVICE.PASSPHRASE,
                    this.device,
                    (response: PassphrasePromptResponse, error?: Error) => {
                        this._cancelableRequest = undefined;
                        if (error) {
                            reject(error);
                        } else {
                            resolve(response);
                        }
                    },
                );
            } else {
                // eslint-disable-next-line no-console
                console.warn(
                    '[DeviceCommands] [call] Passphrase callback not configured, cancelling request',
                );
                reject(
                    ERRORS.TypedError(
                        'Runtime',
                        '_promptPassphrase: Passphrase callback not configured',
                    ),
                );
            }
        });
    }

    _promptWord(type: string) {
        return new Promise<string>((resolve, reject) => {
            this._cancelableRequest = reject;
            // REF-TODO improve types
            // @ts-ignore
            this.device.emit(DEVICE.WORD, this.device, type, (err, word) => {
                this._cancelableRequest = undefined;
                if (err || word == null) {
                    reject(err);
                } else {
                    resolve(word.toLocaleLowerCase());
                }
            });
        });
    }

    async getAccountDescriptor(
        coinInfo: CoinInfo,
        indexOrPath: number | number[],
        derivationType?: Messages.CardanoDerivationType,
        // REF-TODO add some throw error in the end
        // @ts-ignore
    ): Promise<{ descriptor: string; legacyXpub?: string; address_n: number[] }> {
        const address_n = Array.isArray(indexOrPath)
            ? indexOrPath
            : getAccountAddressN(coinInfo, indexOrPath);

        if (coinInfo.type === 'bitcoin') {
            const resp = await this.getHDNode(address_n, coinInfo, false);
            if (isTaprootPath(address_n)) {
                // wrap regular xpub into bitcoind native descriptor
                resp.xpubSegwit = `tr([5c9e228d/86'/${fromHardened(address_n[1])}'/${fromHardened(
                    address_n[2],
                )}']${resp.xpub}/<0;1>/*)`;
            }
            return {
                descriptor: resp.xpubSegwit || resp.xpub,
                legacyXpub: resp.xpub,
                address_n,
            };
        }
        if (coinInfo.type === 'ethereum') {
            const resp = await this.ethereumGetAddress({ address_n });
            return {
                descriptor: resp.address,
                address_n,
            };
        }
        if (coinInfo.shortcut === 'ADA' || coinInfo.shortcut === 'tADA') {
            if (typeof derivationType === 'undefined')
                throw new Error('Derivation type is not specified');

            const { message } = await this.typedCall('CardanoGetPublicKey', 'CardanoPublicKey', {
                address_n,
                // $FlowIssue - is specified
                derivation_type: derivationType,
            });
            return {
                descriptor: message.xpub,
                address_n,
            };
        }
        if (coinInfo.shortcut === 'XRP' || coinInfo.shortcut === 'tXRP') {
            const { message } = await this.typedCall('RippleGetAddress', 'RippleAddress', {
                address_n,
            });
            return {
                descriptor: message.address,
                address_n,
            };
        }
        // REF-TODO:
        // throw new Error('unsupported coinInfo.type')
    }

    // TODO: implement whole "cancel" logic in "trezor-link"
    async cancel() {
        // TEMP: this patch should be implemented in 'trezor-link' instead
        // NOTE:
        // few ButtonRequests can be canceled by design because they are awaiting for user input
        // those are: Pin, Passphrase, Word
        // _cancelableRequest holds reference to the UI promise `reject` method
        // in those cases `this.transport.call` needs to be used
        // calling `this.transport.post` (below) will result with throttling somewhere in low level
        // trezor-link or trezord (not sure which one) will reject NEXT incoming call with "Cancelled" error
        if (this._cancelableRequest) {
            this._cancelableRequest();
            this._cancelableRequest = undefined;
            return;
        }

        if (this.disposed) {
            return;
        }

        /**
         * Bridge version =< 2.0.28 has a bug that doesn't permit it to cancel
         * user interactions in progress, so we have to do it manually.
         */
        const { activeName, version } = this.transport;
        if (
            activeName &&
            activeName === 'BridgeTransport' &&
            versionCompare(version, '2.0.28') < 1
        ) {
            await this.device.legacyForceRelease();
        } else {
            await this.transport.post(this.sessionId, 'Cancel', {}, false);
            // post does not read back from usb stack. this means that there is a pending message left
            // and we need to remove it so that it does not interfere with the next transport call.
            // see DeviceCommands.typedCall
            await this.transport.read(this.sessionId, false);
        }
    }
}
