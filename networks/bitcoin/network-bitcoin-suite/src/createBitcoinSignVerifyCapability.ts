import type TrezorConnect from '@trezor/connect';
import type {
    SignVerifyCapability,
    SignVerifyCapabilityHelpers,
} from '@trezor/network-module-suite-types';

type BitcoinSignVerifyConnect = Pick<
    typeof TrezorConnect,
    'getAddress' | 'signMessage' | 'verifyMessage'
>;

export const createBitcoinSignVerifyCapability = (
    trezorConnect: BitcoinSignVerifyConnect,
    { formatSignedMessage, getAccountAddressesForSigning }: SignVerifyCapabilityHelpers,
): SignVerifyCapability => ({
    getSignAddresses: getAccountAddressesForSigning,
    sign: ({ device, path, coin, message, hex, signOption }) =>
        trezorConnect.signMessage({
            device,
            path,
            coin,
            message,
            hex,
            no_script_type: signOption,
        }),
    verify: ({ device, address, coin, message, signature, hex }) =>
        trezorConnect.verifyMessage({
            device,
            address,
            coin,
            message,
            signature,
            hex,
        }),
    showAddress: ({ device, address, path, coin, chunkify }) =>
        trezorConnect.getAddress({
            device,
            address,
            path,
            coin,
            chunkify,
        }),
    formatSignedMessage: (data, network) =>
        formatSignedMessage(data, (network?.name ?? '').split('(')[0]?.toUpperCase() ?? ''),
});
