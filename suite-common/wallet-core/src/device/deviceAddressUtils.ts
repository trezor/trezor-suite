import { type NetworkSymbol, type NetworkType } from '@suite-common/wallet-config';
import TrezorConnect, { type PROTO } from '@trezor/connect';
import { type SerializedError } from '@trezor/connect-common/src/constants/errors';
import { type DeviceIdentity } from '@trezor/connect-common/src/types/params';
import { type Result } from '@trezor/type-utils';

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
    coin,
    showOnTrezor = true,
    derivationType,
}: GetPublicKeyForNetworkTypeParams) => {
    const params = { device, path, coin, showOnTrezor };

    switch (networkType) {
        case 'bitcoin':
            return TrezorConnect.getPublicKey(params);
        case 'cardano':
            return TrezorConnect.cardanoGetPublicKey({ ...params, derivationType });
        case 'solana':
            return TrezorConnect.solanaGetPublicKey(params);
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
    coin,
    showOnTrezor = true,
    chunkify = false,
    unlockPath,
    cardano,
}: GetAddressForNetworkTypeParams) => {
    const params = { device, path, unlockPath, coin, chunkify, showOnTrezor };

    switch (networkType) {
        case 'tron':
            return TrezorConnect.tronGetAddress(params);
        case 'ethereum':
            return TrezorConnect.ethereumGetAddress(params);
        case 'cardano':
            if (!cardano) {
                return methodNotDefinedError('getAddress');
            }

            return TrezorConnect.cardanoGetAddress({ device, chunkify, ...cardano });
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
