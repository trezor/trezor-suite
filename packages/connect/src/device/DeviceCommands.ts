// original file https://github.com/trezor/connect/blob/develop/src/js/device/DeviceCommands.js

import { randomBytes } from 'crypto';
import { Transport, Session } from '@trezor/transport';
import { MessagesSchema as Messages } from '@trezor/protobuf';
import { versionUtils } from '@trezor/utils';
import { ERRORS } from '../constants';
import { DEVICE } from '../events';
import * as hdnodeUtils from '../utils/hdnodeUtils';
import { isTaprootPath, getSerializedPath, getScriptType, toHardened } from '../utils/pathUtils';
import { getAccountAddressN } from '../utils/accountUtils';
import { getSegwitNetwork, getBech32Network } from '../data/coinInfo';
import { initLog } from '../utils/debug';

import { Device } from './Device';
import type { CoinInfo, BitcoinNetworkInfo, Network } from '../types';
import type { HDNodeResponse } from '../types/api/getPublicKey';
import { Assert } from '@trezor/schema-utils';
import { resolveDescriptorForTaproot } from './resolveDescriptorForTaproot';

type MessageType = Messages.MessageType;
type MessageKey = keyof MessageType;
export type TypedResponseMessage<T extends MessageKey> = {
    type: T;
    message: MessageType[T];
};
type TypedCallResponseMap = {
    [K in keyof MessageType]: TypedResponseMessage<K>;
};
type DefaultMessageResponse = TypedCallResponseMap[keyof MessageType];

export type PassphrasePromptResponse = {
    passphrase?: string;
    passphraseOnDevice?: boolean;
    cache?: boolean;
};

const logger = initLog('DeviceCommands');

const assertType = (res: DefaultMessageResponse, resType: MessageKey | MessageKey[]) => {
    const splitResTypes = Array.isArray(resType) ? resType : resType.split('|');
    if (!splitResTypes.includes(res.type)) {
        throw ERRORS.TypedError(
            'Runtime',
            `assertType: Response of unexpected type: ${res.type}. Should be ${resType}`,
        );
    }
};

const generateEntropy = (len: number) => {
    try {
        return randomBytes(len);
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

export class DeviceCommands {
    device: Device;

    transport: Transport;

    sessionId: Session;

    disposed: boolean;

    callPromise?: ReturnType<Transport['call']>;

    // see DeviceCommands.cancel
    _cancelableRequest?: (error?: any) => void;
    _cancelableRequestBySend?: boolean;

    constructor(device: Device, transport: Transport, sessionId: Session) {
        this.device = device;
        this.transport = transport;
        this.sessionId = sessionId;
        this.disposed = false;
    }

    dispose() {
        this.disposed = true;
        this._cancelableRequest = undefined;
    }

    isDisposed() {
        return this.disposed;
    }

    unlockPath(params?: Messages.UnlockPath) {
        return this.typedCall('UnlockPath', 'UnlockedPathRequest', params);
    }

    async getPublicKey(params: Messages.GetPublicKey, unlockPath?: Messages.UnlockPath) {
        if (unlockPath) {
            await this.unlockPath(unlockPath);
        }

        const response = await this.typedCall('GetPublicKey', 'PublicKey', {
            address_n: params.address_n,
            coin_name: params.coin_name || 'Bitcoin',
            script_type: params.script_type,
            show_display: params.show_display,
            ignore_xpub_magic: params.ignore_xpub_magic,
            ecdsa_curve_name: params.ecdsa_curve_name,
        });

        return response.message;
    }

    // Validation of xpub
    async getHDNode(
        params: Messages.GetPublicKey,
        options: {
            coinInfo: BitcoinNetworkInfo;
            validation?: boolean;
            unlockPath?: Messages.UnlockPath;
        },
    ) {
        const path = params.address_n;
        const { coinInfo, unlockPath } = options;
        const validation = typeof options.validation === 'boolean' ? options.validation : true;

        let network: Network | null = null;

        if (!params.script_type) {
            params.script_type = getScriptType(path);
        }

        if (params.script_type === 'SPENDP2SHWITNESS') {
            network = getSegwitNetwork(coinInfo);
        } else if (params.script_type === 'SPENDWITNESS') {
            network = getBech32Network(coinInfo);
        }

        if (!network) {
            network = coinInfo.network;
        }

        if (!params.coin_name) {
            // use default name
            params.coin_name = coinInfo.name;
        }

        let publicKey: Messages.PublicKey;
        if (params.show_display || !validation) {
            publicKey = await this.getPublicKey(params, unlockPath);
        } else {
            const suffix = 0;
            const childPath = path.concat([suffix]);
            const resKey = await this.getPublicKey(params, unlockPath);
            const childKey = await this.getPublicKey(
                { ...params, address_n: childPath },
                unlockPath,
            );
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

        if (isTaprootPath(path)) {
            const { checksum, xpub: xpubSegwit } = resolveDescriptorForTaproot({
                response,
                publicKey,
            });
            response.xpubSegwit = xpubSegwit;
            response.descriptorChecksum = checksum;
        }

        return response;
    }

    async getAddress(
        { address_n, show_display, multisig, script_type, chunkify }: Messages.GetAddress,
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
            chunkify,
        });

        return {
            path: address_n,
            serializedPath: getSerializedPath(address_n),
            address: response.message.address,
        };
    }

    async ethereumGetAddress({
        address_n,
        show_display,
        encoded_network,
        chunkify,
    }: Messages.EthereumGetAddress) {
        const response = await this.typedCall('EthereumGetAddress', 'EthereumAddress', {
            address_n,
            show_display,
            encoded_network,
            chunkify,
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

    async preauthorize(throwError: boolean) {
        try {
            await this.typedCall('DoPreauthorized', 'PreauthorizedRequest', {});

            return true;
        } catch (error) {
            if (throwError) throw error;

            return false;
        }
    }

    getDeviceState() {
        return this._getAddress();
    }

    // Sends an async message to the opened device.
    private async call(
        type: MessageKey,
        msg: DefaultMessageResponse['message'] = {},
    ): Promise<DefaultMessageResponse> {
        logger.debug('Sending', type, filterForLog(type, msg));

        this.callPromise = this.transport.call({
            session: this.sessionId,
            name: type,
            data: msg,
            protocol: this.device.protocol,
        });

        const res = await this.callPromise.promise;

        this.callPromise = undefined;
        if (!res.success) {
            logger.warn('Received error', res.error);
            throw new Error(res.error);
        }

        logger.debug(
            'Received',
            res.payload.type,
            filterForLog(res.payload.type, res.payload.message),
        );

        // TODO: https://github.com/trezor/trezor-suite/issues/5301
        // @ts-expect-error
        return res.payload;
    }

    typedCall<T extends MessageKey, R extends MessageKey[]>(
        type: T,
        resType: R,
        msg?: MessageType[T],
    ): Promise<TypedCallResponseMap[R[number]]>;
    typedCall<T extends MessageKey, R extends MessageKey>(
        type: T,
        resType: R,
        msg?: MessageType[T],
    ): Promise<TypedResponseMessage<R>>;
    async typedCall(
        type: MessageKey,
        resType: MessageKey | MessageKey[],
        msg?: DefaultMessageResponse['message'],
    ) {
        if (this.disposed) {
            throw ERRORS.TypedError('Runtime', 'typedCall: DeviceCommands already disposed');
        }
        // Assert message type
        // msg is allowed to be undefined for some calls, in that case the schema is an empty object
        Assert(Messages.MessageType.properties[type], msg ?? {});
        const response = await this._commonCall(type, msg);
        try {
            assertType(response, resType);
        } catch (error) {
            // handle possible race condition
            // Bridge may have some unread message in buffer, read it
            await this.transport.receive({
                session: this.sessionId,
                protocol: this.device.protocol,
            });
            // throw error anyway, next call should be resolved properly
            throw error;
        }

        return response;
    }

    async _commonCall(type: MessageKey, msg?: DefaultMessageResponse['message']) {
        const resp = await this.call(type, msg);
        if (this.disposed) {
            throw ERRORS.TypedError('Runtime', 'typedCall: DeviceCommands already disposed');
        }

        return this._filterCommonTypes(resp);
    }

    _filterCommonTypes(res: DefaultMessageResponse): Promise<DefaultMessageResponse> {
        this._cancelableRequestBySend = false;

        if (res.type === 'Failure') {
            const { code } = res.message;
            let { message } = res.message;
            // T1B1 does not send any message in firmware update
            // https://github.com/trezor/trezor-firmware/issues/1334
            // @ts-expect-error, TODO: https://github.com/trezor/trezor-suite/issues/5299
            if (code === 'Failure_FirmwareError' && !message) {
                message = 'Firmware installation failed';
            }
            // Failure_ActionCancelled message could be also missing
            // https://github.com/trezor/connect/issues/865
            // @ts-expect-error, TODO: https://github.com/trezor/trezor-suite/issues/5299
            if (code === 'Failure_ActionCancelled' && !message) {
                message = 'Action cancelled by user';
            }

            // pass code and message from firmware error
            return Promise.reject(
                new ERRORS.TrezorError(
                    (code as any) || 'Failure_UnknownCode',
                    message || 'Failure_UnknownMessage',
                ),
            );
        }

        if (res.type === 'Features') {
            return Promise.resolve(res);
        }

        if (res.type === 'ButtonRequest') {
            this._cancelableRequestBySend = true;

            if (res.message.code === 'ButtonRequest_PassphraseEntry') {
                this.device.emit(DEVICE.PASSPHRASE_ON_DEVICE);
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
                pin =>
                    this._commonCall('PinMatrixAck', { pin }).then(response => {
                        if (!this.device.features.unlocked) {
                            // reload features to after successful PIN
                            return this.device.getFeatures().then(() => response);
                        }

                        return response;
                    }),
                () => this._commonCall('Cancel', {}),
            );
        }

        if (res.type === 'PassphraseRequest') {
            return this._promptPassphrase().then(
                response => {
                    const { passphrase, passphraseOnDevice } = response;

                    return !passphraseOnDevice
                        ? this._commonCall('PassphraseAck', { passphrase })
                        : this._commonCall('PassphraseAck', { on_device: true });
                },
                // todo: does it make sense? error might have resulted from device disconnected.
                // with webusb, this leads to pretty common "Session not found"
                err =>
                    this._commonCall('Cancel', {}).catch((e: any) => {
                        throw err || e;
                    }),
            );
        }

        if (res.type === 'WordRequest') {
            return this._promptWord(res.message.type).then(
                word => this._commonCall('WordAck', { word }),
                () => this._commonCall('Cancel', {}),
            );
        }

        return Promise.resolve(res);
    }

    private async _getAddress() {
        const { message } = await this.typedCall('GetAddress', 'Address', {
            address_n: [toHardened(44), toHardened(1), toHardened(0), 0, 0],
            coin_name: 'Testnet',
            script_type: 'SPENDADDRESS',
        });

        return message.address;
    }

    _promptPin(type?: Messages.PinMatrixRequestType) {
        return new Promise<string>((resolve, reject) => {
            if (this.device.listenerCount(DEVICE.PIN) > 0) {
                this._cancelableRequest = reject;
                this.device.emit(DEVICE.PIN, this.device, type, (err, pin) => {
                    this._cancelableRequest = undefined;
                    if (err || pin == null) {
                        reject(err);
                    } else {
                        resolve(pin);
                    }
                });
            } else {
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

    _promptWord(type: Messages.WordRequestType) {
        return new Promise<string>((resolve, reject) => {
            this._cancelableRequest = reject;
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
    ): Promise<{
        descriptor: string;
        legacyXpub?: string;
        address_n: number[];
        descriptorChecksum?: string;
    }> {
        const address_n = Array.isArray(indexOrPath)
            ? indexOrPath
            : getAccountAddressN(coinInfo, indexOrPath);

        if (coinInfo.type === 'bitcoin') {
            const resp = await this.getHDNode({ address_n }, { coinInfo, validation: false });

            return {
                descriptor: resp.xpubSegwit || resp.xpub,
                legacyXpub: resp.xpub,
                address_n,
                descriptorChecksum: resp.descriptorChecksum,
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

        if (coinInfo.shortcut === 'SOL' || coinInfo.shortcut === 'DSOL') {
            const { message } = await this.typedCall('SolanaGetAddress', 'SolanaAddress', {
                address_n,
            });

            return {
                descriptor: message.address,
                address_n,
            };
        }

        throw ERRORS.TypedError(
            'Runtime',
            'DeviceCommands.getAccountDescriptor: unsupported coinInfo.type',
        );
    }

    async cancel() {
        // _cancelableRequest is transport.call({ name: 'Cancel' }).
        if (this._cancelableRequest) {
            this._cancelableRequest();
            this._cancelableRequest = undefined;

            return;
        }

        if (this.disposed) {
            return;
        }
        this.dispose();

        if (!this._cancelableRequestBySend) {
            if (this.callPromise) {
                await this.callPromise.promise;
            }

            return;
        }
        /**
         * Bridge version =< 2.0.28 has a bug that doesn't permit it to cancel
         * user interactions in progress, so we have to do it manually.
         */
        const { name, version } = this.transport;
        if (name === 'BridgeTransport' && !versionUtils.isNewer(version, '2.0.28')) {
            try {
                await this.device.legacyForceRelease();
            } catch (err) {
                // ignore
            }
        } else {
            await this.transport.send({
                protocol: this.device.protocol,
                session: this.sessionId,
                name: 'Cancel',
                data: {},
            }).promise;

            if (this.callPromise) {
                await this.callPromise.promise;
            }
            // if my observations are correct, it is not necessary to transport.receive after send
            // transport.call -> transport.send -> transport call returns Failure meaning it won't be
            // returned in subsequent calls
            // await this.transport.receive({ session: this.sessionId }).promise;
        }
    }
}

export type TypedCall = DeviceCommands['typedCall'];
