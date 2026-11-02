import { type NetworkSymbol, type NetworkType } from '@suite-common/wallet-config';
import TrezorConnect, { type AccountInfo, type PROTO } from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import { type SerializedError } from '@trezor/connect-common/src/constants/errors';
import { type DeviceIdentity } from '@trezor/connect-common/src/types/params';
import { type Result, exhaustive } from '@trezor/type-utils';

type DeviceParam = DeviceIdentity & { useEmptyPassphrase?: boolean };

const methodNotDefinedError = (method: string): Result<never, SerializedError> => ({
    success: false,
    error: {
        message: `Method for ${method} not defined`,
        code: 'Failure_UnknownCode',
    },
});

type GetPublicKeyForNetworkTypeParams = {
    device: DeviceParam;
    networkType: NetworkType;
    path: string;
    coin?: NetworkSymbol;
    showOnTrezor?: boolean;
    // Only meaningful for `cardano`.
    derivationType?: PROTO.CardanoDerivationType;
};

// Single entry point for "show/derive the public key on-device", used both by regular account
// discovery (showXpubOnDevice) and by any other caller that only has a bare device+path+coin,
// without a full Account (e.g. the connect-popup selectAccount picker, verifying a not-yet-added
// candidate). Not every network exposes a public key on-device (see the `default` case).
export const getPublicKeyForNetworkType = ({
    device,
    networkType,
    path,
    coin: symbol,
    showOnTrezor = true,
    derivationType,
}: GetPublicKeyForNetworkTypeParams) => {
    const coin = symbol && asCoinSymbol(symbol);
    const params = { device, path, coin, showOnTrezor, derivationType };

    switch (networkType) {
        case 'bitcoin':
            return TrezorConnect.getPublicKey(params);
        case 'cardano':
            return TrezorConnect.cardanoGetPublicKey(params);
        default:
            return methodNotDefinedError('getPublicKey');
    }
};

type CardanoAddressForNetworkTypeParams = {
    addressParameters: {
        path: string;
        addressType: PROTO.CardanoAddressType;
        stakingPath: string;
    };
    protocolMagic: number;
    networkId: number;
    derivationType: PROTO.CardanoDerivationType;
};

type GetAddressForNetworkTypeParams = {
    device: DeviceParam;
    networkType: NetworkType;
    path: string;
    coin?: NetworkSymbol;
    showOnTrezor?: boolean;
    chunkify?: boolean;
    unlockPath?: PROTO.UnlockPath;
    // Required to resolve `cardano` — omitted callers (e.g. a bare candidate with no derived
    // Account) get the same "not defined" error as a genuinely unsupported network.
    cardano?: CardanoAddressForNetworkTypeParams;
};

// Single entry point for "show/derive an address on-device". `getAddress` only understands
// Bitcoin-like coins — every other network has its own dedicated GetAddress method.
export const getAddressForNetworkType = ({
    device,
    networkType,
    path,
    coin: symbol,
    showOnTrezor = true,
    chunkify = false,
    unlockPath,
    cardano,
}: GetAddressForNetworkTypeParams) => {
    const coin = symbol && asCoinSymbol(symbol);
    const params = { device, path, unlockPath, coin, chunkify, showOnTrezor };

    switch (networkType) {
        case 'tron':
            return TrezorConnect.tronGetAddress(params);
        case 'ethereum':
            return TrezorConnect.ethereumGetAddress(params);
        case 'cardano':
            return cardano
                ? TrezorConnect.cardanoGetAddress({ device, chunkify, ...cardano })
                : methodNotDefinedError('getAddress');
        case 'ripple':
            return TrezorConnect.rippleGetAddress(params);
        case 'bitcoin':
            return TrezorConnect.getAddress(params);
        case 'solana':
            return TrezorConnect.solanaGetAddress(params);
        case 'stellar':
            return TrezorConnect.stellarGetAddress(params);
        default:
            return methodNotDefinedError('getAddress');
    }
};

type GetDescriptorForNetworkTypeParams = {
    device: DeviceParam;
    networkType: NetworkType;
    path: string;
    coin?: NetworkSymbol;
    // Only meaningful for `cardano`.
    derivationType?: PROTO.CardanoDerivationType;
};

type DeviceAccountDescriptor = Pick<
    AccountInfo,
    'descriptor' | 'legacyXpub' | 'descriptorChecksum' | 'outputDescriptorBip380'
>;

// Returns the account descriptor (xpub for UTXO networks, address for account-based networks)
// with the device-derived fields which `TrezorConnect.getAccountInfo({ descriptor })` lacks.
export const getDescriptorForNetworkType = ({
    device,
    networkType,
    path,
    coin: symbol,
    derivationType,
}: GetDescriptorForNetworkTypeParams): Promise<
    Result<DeviceAccountDescriptor, SerializedError>
> => {
    const coin = symbol && asCoinSymbol(symbol);
    const params = { device, path, coin, showOnTrezor: false, derivationType };

    const extractDescriptor =
        <T, E>(extract: (payload: T) => DeviceAccountDescriptor) =>
        (res: Result<T, E>) =>
            res.success ? { success: true as const, payload: extract(res.payload) } : res;

    switch (networkType) {
        case 'bitcoin':
            return TrezorConnect.getPublicKey(params).then(
                extractDescriptor(({ xpub, xpubSegwit, descriptorChecksum, descriptor }) => ({
                    descriptor: xpubSegwit ?? xpub,
                    legacyXpub: xpub,
                    descriptorChecksum,
                    outputDescriptorBip380: descriptor,
                })),
            );
        case 'cardano':
            return TrezorConnect.cardanoGetPublicKey(params).then(
                extractDescriptor(({ xpub }) => ({ descriptor: xpub })),
            );
        case 'ethereum':
            return TrezorConnect.ethereumGetAddress(params).then(
                extractDescriptor(({ address }) => ({ descriptor: address })),
            );
        case 'ripple':
            return TrezorConnect.rippleGetAddress(params).then(
                extractDescriptor(({ address }) => ({ descriptor: address })),
            );
        case 'solana':
            return TrezorConnect.solanaGetAddress(params).then(
                extractDescriptor(({ address }) => ({ descriptor: address })),
            );
        case 'stellar':
            return TrezorConnect.stellarGetAddress(params).then(
                extractDescriptor(({ address }) => ({ descriptor: address })),
            );
        case 'tron':
            return TrezorConnect.tronGetAddress(params).then(
                extractDescriptor(({ address }) => ({ descriptor: address })),
            );
        default:
            return exhaustive(networkType);
    }
};
